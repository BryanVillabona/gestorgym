import inquirer from 'inquirer';
import Command from './Command.js';
import { success, log, error, info } from '../utils/logger.js';
import database from '../config/mongodb.js';

import ClienteRepository from '../repositories/ClienteRepository.js';
import PlanEntrenamientoRepository from '../repositories/PlanEntrenamientoRepository.js';
import ContratoRepository from '../repositories/ContratoRepository.js';
import TransaccionRepository from '../repositories/TransaccionRepository.js';
import PlanNutricionalRepository from '../repositories/PlanNutricionalRepository.js';

import { createCliente } from '../models/Cliente.js';
import { createContrato } from '../models/Contrato.js';
import { createTransaccion } from '../models/TransaccionFinanciera.js';
import { createPlanNutricional } from '../models/PlanNutricional.js';

export default class CrearClienteCommand extends Command {
  constructor() {
    super();
    this.clienteRepository = new ClienteRepository();
    this.planRepo = new PlanEntrenamientoRepository();
    this.contratoRepo = new ContratoRepository();
    this.transaccionRepo = new TransaccionRepository();
    this.planNutricionalRepo = new PlanNutricionalRepository();
  }

  async execute() {
    log('--- Inscripción de Nuevo Cliente y Asignación de Plan ---');

    // --- ETAPA 1: RECOPILAR INFORMACIÓN ---
    log(info('Paso 1 de 4: Datos del nuevo cliente'));
    const datosCliente = await inquirer.prompt([
      { type: 'input', name: 'nombre', message: 'Nombre completo:', validate: v => v.length > 0 || 'Requerido.' },
      { type: 'input', name: 'email', message: 'Correo electrónico:', validate: v => /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(v) || 'Email inválido.' },
      { type: 'input', name: 'telefono', message: 'Teléfono (10 dígitos):', validate: v => /^\d{10}$/.test(v) || 'Teléfono inválido.' },
    ]);

    log(info('\nPaso 2 de 4: Selección del plan de entrenamiento'));
    const planes = await this.planRepo.findAll();
    if (planes.length === 0) {
      log(error("No hay planes de entrenamiento creados. No se puede inscribir al cliente."));
      return;
    }
    const { planSeleccionado } = await inquirer.prompt({
      type: 'list', name: 'planSeleccionado', message: 'Selecciona un plan:',
      choices: planes.map(p => ({ name: `${p.nombre} - $${p.precio_sugerido.toLocaleString('es-CO')}`, value: p })),
    });

    log(info('\nPaso 3 de 4: Confirmación del contrato'));
    const { precioFinal } = await inquirer.prompt({
      type: 'input', name: 'precioFinal', message: 'Precio final del contrato:',
      default: planSeleccionado.precio_sugerido,
      validate: (v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0 || 'Precio inválido.',
    });

    // --- LÓGICA DEL PLAN NUTRICIONAL OPCIONAL ---
    log(info('\nPaso 4 de 4: Plan Nutricional (Opcional)'));
    const { anadirPlanNutricional } = await inquirer.prompt({
      type: 'confirm',
      name: 'anadirPlanNutricional',
      message: '¿Deseas añadir un plan nutricional a este contrato?',
      default: false
    });

    let datosPlanNutricional = null;
    let comidas = [];
    if (anadirPlanNutricional) {
      datosPlanNutricional = await inquirer.prompt([
        { type: 'input', name: 'nombre', message: 'Nombre para el plan nutricional:', validate: v => v.length > 0 || 'Requerido.' },
        { type: 'input', name: 'descripcion', message: 'Descripción del plan nutricional:' }
      ]);

      const tiposDeComida = ["desayuno", "almuerzo", "cena"];
      let continuarAñadiendo = true;
      while (continuarAñadiendo && comidas.length < tiposDeComida.length) {
        const comidasYaAñadidas = comidas.map(c => c.nombre);
        const opcionesDisponibles = tiposDeComida
          .filter(tipo => !comidasYaAñadidas.includes(tipo))
          .map(tipo => ({ name: tipo.charAt(0).toUpperCase() + tipo.slice(1), value: tipo }));

        if (opcionesDisponibles.length === 0) break;

        opcionesDisponibles.push(new inquirer.Separator(), { name: 'Terminar y guardar', value: 'terminar' });

        const { tipoComida } = await inquirer.prompt({
          type: 'list', name: 'tipoComida',
          message: `Añadir comida (${comidas.length + 1}/${tiposDeComida.length}):`,
          choices: opcionesDisponibles
        });

        if (tipoComida === 'terminar') { continuarAñadiendo = false; continue; }

        const detallesComida = await inquirer.prompt([
          { type: 'input', name: 'descripcion', message: `Descripción para ${tipoComida}:`, validate: v => v.length > 0 || 'La descripción es requerida.' },
          {
            type: 'input', name: 'caloriasEstimadas', message: 'Calorías estimadas (opcional):',
            validate: (v) => v === '' || !isNaN(parseInt(v)) && parseInt(v) >= 0 || 'Introduce un número válido.'
          }
        ]);

        const nuevaComida = { nombre: tipoComida, descripcion: detallesComida.descripcion };
        if (detallesComida.caloriasEstimadas) { nuevaComida.caloriasEstimadas = parseInt(detallesComida.caloriasEstimadas, 10); }
        comidas.push(nuevaComida);
        log(success(`› ${tipoComida.charAt(0).toUpperCase() + tipoComida.slice(1)} añadido.`));
      }
    }

    log(info('\nPaso 5 de 5: Asignar Entrenador (Opcional)'));
    const entrenadores = await this.entrenadorRepo.findAll();
    const choicesEntrenadores = [
      { name: 'No asignar entrenador ahora', value: null },
      new inquirer.Separator(),
      ...entrenadores.map(e => ({ name: e.nombre, value: e._id }))
    ];
    const { entrenadorId } = await inquirer.prompt({
      type: 'list', name: 'entrenadorId', message: '¿Asignar un entrenador a este contrato?',
      choices: choicesEntrenadores
    });

    // --- ETAPA 2: EJECUTAR LA TRANSACCIÓN ATÓMICA COMPLETA ---
    const mongoClient = database.getMongoClient();
    const session = mongoClient.startSession();
    let nuevoClienteId, nuevoContratoId;

    try {
      log(info("\nProcesando inscripción..."));
      await session.withTransaction(async () => {
        // Operación A: Crear el cliente
        const clienteData = createCliente(datosCliente);
        const clienteResult = await this.clienteRepository.create(clienteData, { session });
        nuevoClienteId = clienteResult.insertedId;

        // Operación B: Crear el contrato
        const contratoData = createContrato({
                clienteId: nuevoClienteId,
                planId: planSeleccionado._id,
                precio: precioFinal,
                duracion_dias: planSeleccionado.duracion_dias,
                entrenadorId: entrenadorId // <-- PASAMOS EL NUEVO DATO
            });
            const contratoResult = await this.contratoRepo.create(contratoData, { session });
            nuevoContratoId = contratoResult.insertedId;

        // Operación C: Crear el pago inicial
        const transaccionData = createTransaccion({
          contratoId: nuevoContratoId, clienteId: nuevoClienteId, monto: precioFinal,
          descripcion: `Pago de inscripción - ${planSeleccionado.nombre}`
        });
        await this.transaccionRepo.create(transaccionData, { session });

        // Operación D (CONDICIONAL): Crear el plan nutricional
        if (anadirPlanNutricional && comidas.length > 0) {
          const planNutricionalData = createPlanNutricional({
            contratoId: nuevoContratoId,
            nombre: datosPlanNutricional.nombre,
            descripcion: datosPlanNutricional.descripcion,
            comidas: comidas
          });
          await this.planNutricionalRepo.create(planNutricionalData, { session });
        }
      });

      let mensajeExito = `\n¡Inscripción completada exitosamente!`;
      if (anadirPlanNutricional && comidas.length > 0) {
        mensajeExito += `\nSe ha creado el contrato y el plan nutricional asociado.`;
      }
      log(success(mensajeExito));

    } catch (err) {
      log(error(`\nLa inscripción ha fallado y se ha revertido: ${err.message}`));
    } finally {
      await session.endSession();
    }
  }
}