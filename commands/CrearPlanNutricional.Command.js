import inquirer from 'inquirer';
import Command from './Command.js';
import { success, log, error, info } from '../utils/logger.js';
import ContratoRepository from '../repositories/ContratoRepository.js';
import PlanNutricionalRepository from '../repositories/PlanNutricionalRepository.js';
import { createPlanNutricional } from '../models/PlanNutricional.js';
import dayjs from 'dayjs';

export default class CrearPlanNutricionalCommand extends Command {
  constructor() {
    super();
    this.contratoRepo = new ContratoRepository();
    this.planNutricionalRepo = new PlanNutricionalRepository();
  }

  async execute() {
    log('--- Registrar Plan Nutricional Diario ---');
    try {
      // 1. Obtenemos TODOS los contratos activos con su info de nutrición
      const todosLosContratosActivos = await this.contratoRepo.findAllActivosConNutricionInfo();
      const inicioDeHoy = dayjs().startOf('day');

      // 2. AHORA aplicamos el filtro inteligente aquí, en el código.
      const contratosElegibles = todosLosContratosActivos.filter(contrato => {
        // Condición A: No tiene ningún plan nutricional. Es elegible.
        if (contrato.planesNutricionales.length === 0) {
          return true;
        }
        // Condición B: Sí tiene planes, así que buscamos la fecha del más reciente.
        const ultimaFecha = Math.max(...contrato.planesNutricionales.map(p => new Date(p.fechaRegistro).getTime()));
        // Si la última fecha es ANTES de hoy, es elegible.
        return dayjs(ultimaFecha).isBefore(inicioDeHoy);
      });

      if (contratosElegibles.length === 0) {
        log(info("No hay contratos elegibles para registrar un plan nutricional hoy."));
        log(info("(Un contrato es elegible si está activo y no tiene un plan registrado hoy)."));
        return;
      }

      // El resto del flujo de selección en dos pasos es el mismo y funciona perfecto.
      const clientesUnicosMap = new Map();
      contratosElegibles.forEach(contrato => {
        clientesUnicosMap.set(contrato.clienteInfo._id.toString(), contrato.clienteInfo.nombre);
      });
      const clientesChoices = Array.from(clientesUnicosMap.entries()).map(([id, nombre]) => ({ name: nombre, value: id }));
      
      const { clienteIdStr } = await inquirer.prompt({
        type: 'list', name: 'clienteIdStr', message: 'Selecciona el CLIENTE para añadirle un plan nutricional:',
        choices: clientesChoices,
      });

      const contratosDelCliente = contratosElegibles.filter(c => c.clienteInfo._id.toString() === clienteIdStr);
      
      let contratoId;
      if (contratosDelCliente.length === 1) {
          contratoId = contratosDelCliente[0]._id;
          log(info(`Contrato con el plan "${contratosDelCliente[0].planInfo.nombre}" seleccionado.`));
      } else {
          const { selectedContratoId } = await inquirer.prompt({
              type: 'list',
              name: 'selectedContratoId',
              message: 'Este cliente tiene varios contratos elegibles. Selecciona uno:',
              // --- INICIO DE LA MEJORA CLAVE ---
              // Ahora el 'name' que se muestra al usuario incluye el nombre del plan de entrenamiento,
              // dándole el contexto necesario para tomar la decisión correcta.
              choices: contratosDelCliente.map(c => ({
                  name: `Plan: ${c.planInfo.nombre} (Vence: ${dayjs(c.fechaFin).format('YYYY-MM-DD')})`,
                  value: c._id
              }))
              // --- FIN DE LA MEJORA CLAVE ---
          });
          contratoId = selectedContratoId;
      }
      
      const datosPlan = await inquirer.prompt([
        { type: 'input', name: 'nombre', message: 'Nombre del plan nutricional:', validate: v => v.length > 0 || 'El nombre es requerido.' },
        { type: 'input', name: 'descripcion', message: 'Descripción del plan:' },
      ]);

      const comidas = [];
      const tiposDeComida = ["desayuno", "almuerzo", "cena"];
      let continuarAñadiendo = true;
      while (continuarAñadiendo && comidas.length < tiposDeComida.length) {
        const comidasYaAñadidas = comidas.map(c => c.nombre);
        const opcionesDisponibles = tiposDeComida
          .filter(tipo => !comidasYaAñadidas.includes(tipo))
          .map(tipo => ({ name: tipo.charAt(0).toUpperCase() + tipo.slice(1), value: tipo }));
        
        if (opcionesDisponibles.length === 0) break;

        opcionesDisponibles.push(new inquirer.Separator(), { name: 'Terminar y guardar plan', value: 'terminar' });

        const { tipoComida } = await inquirer.prompt({
            type: 'list', name: 'tipoComida',
            message: `Selecciona la comida a registrar (${comidas.length + 1}/${tiposDeComida.length}):`,
            choices: opcionesDisponibles
        });

        if (tipoComida === 'terminar') {
            continuarAñadiendo = false;
            continue;
        }
        
        const detallesComida = await inquirer.prompt([
            { type: 'input', name: 'descripcion', message: `Descripción para ${tipoComida}:`, validate: v => v.length > 0 || 'La descripción es requerida.' },
            { type: 'input', name: 'caloriasEstimadas', message: 'Calorías estimadas (opcional):',
              validate: (v) => v === '' || !isNaN(parseInt(v)) && parseInt(v) >= 0 || 'Introduce un número válido.'}
        ]);
        
        const nuevaComida = { nombre: tipoComida, descripcion: detallesComida.descripcion };
        if (detallesComida.caloriasEstimadas) {
            nuevaComida.caloriasEstimadas = parseInt(detallesComida.caloriasEstimadas, 10);
        }
        comidas.push(nuevaComida);
        log(success(`› ${tipoComida.charAt(0).toUpperCase() + tipoComida.slice(1)} añadido al plan.`));
      }

      if (comidas.length > 0) {
        const planNutricionalData = createPlanNutricional({
          contratoId,
          nombre: datosPlan.nombre,
          descripcion: datosPlan.descripcion,
          comidas: comidas
        });
        await this.planNutricionalRepo.create(planNutricionalData);
        log(success(`\nPlan nutricional diario creado y asignado exitosamente.`));
      } else {
        log(info("\nNo se añadieron comidas, por lo que el plan no fue creado."));
      }

    } catch (err) {
      log(error(`Error al crear el plan nutricional: ${err.message}`));
    }
  }
}