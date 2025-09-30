// Importación de utilidades y librerías
import inquirer from 'inquirer';
import Command from './Command.js';
import { success, log, error, info } from '../utils/logger.js';
import database from '../config/mongodb.js';

// Importación de repositorios
import ClienteRepository from '../repositories/ClienteRepository.js';
import PlanEntrenamientoRepository from '../repositories/PlanEntrenamientoRepository.js';
import ContratoRepository from '../repositories/ContratoRepository.js';
import TransaccionRepository from '../repositories/TransaccionRepository.js';
import PlanNutricionalRepository from '../repositories/PlanNutricionalRepository.js';

// Importación de modelos
import { createContrato } from '../models/Contrato.js';
import { createTransaccion } from '../models/TransaccionFinanciera.js';
import { createPlanNutricional } from '../models/PlanNutricional.js';

// Comando para asociar un plan de entrenamiento a un cliente y generar el contrato correspondiente
export default class AsociarPlanCommand extends Command {
  constructor() {

    // Inicialización de repositorios
    super();
    this.clienteRepo = new ClienteRepository();
    this.planRepo = new PlanEntrenamientoRepository();
    this.contratoRepo = new ContratoRepository();
    this.transaccionRepo = new TransaccionRepository();
    this.planNutricionalRepo = new PlanNutricionalRepository();
  }
  
  // Ejecución del comando
  async execute() {
    log('--- Asociar Plan a Cliente y Generar Contrato ---');
    
    // Obtener y seleccionar cliente
    const clientes = await this.clienteRepo.findAll();

    // Si no hay clientes, salir
    if (clientes.length === 0) { log(info("No hay clientes registrados.")); return; }

    // Selección del cliente para el contrato
    const { clienteId } = await inquirer.prompt({
      type: 'list', name: 'clienteId', message: 'Selecciona un cliente:',
      choices: clientes.map(c => ({ name: c.nombre, value: c._id })),
    });

    // Obtener todos los planes de entrenamiento
    const planes = await this.planRepo.findAll();

    // Si no hay planes de entrenamiento, salir
    if (planes.length === 0) { log(info("No hay planes de entrenamiento registrados.")); return; }

    // Selección del plan de entrenamiento
    const { planSeleccionado } = await inquirer.prompt({
      type: 'list', name: 'planSeleccionado', message: 'Selecciona un plan de entrenamiento:',
      choices: planes.map(p => ({ name: `${p.nombre} - $${p.precio_sugerido.toLocaleString('es-CO')}`, value: p })),
    });

    // Solicitar precio final del contrato (puede ser diferente al sugerido)
    const { precioFinal } = await inquirer.prompt({
      type: 'input', name: 'precioFinal', message: 'Precio final del contrato:',
      default: planSeleccionado.precio_sugerido,
      validate: (v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0 || 'Introduce un precio válido.',
    });

    // Añadir un plan nutricional (opcional)
    const { anadirPlanNutricional } = await inquirer.prompt({
        type: 'confirm',
        name: 'anadirPlanNutricional',
        message: '¿Deseas añadir un plan nutricional a este contrato?',
        default: false
    });

    // --- NUEVA LÓGICA PARA CREAR PLAN NUTRICIONAL ---
    let datosPlanNutricional = null;
    let comidas = [];

    // Si el usuario desea añadir un plan nutricional, recopilar los datos
    if (anadirPlanNutricional) {

      // Recopilar datos básicos del plan nutricional
        datosPlanNutricional = await inquirer.prompt([
            { type: 'input', name: 'nombre', message: 'Nombre para el plan nutricional:', validate: v => v.length > 0 || 'El nombre es requerido.' },
            { type: 'input', name: 'descripcion', message: 'Descripción breve del plan nutricional:' }
        ]);

        // Bucle inteligente para añadir comidas
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
    }
    // --- FIN DE LA NUEVA LÓGICA ---

    // Iniciar sesión para transacción
    const mongoClient = database.getMongoClient();
    const session = mongoClient.startSession();

    try {
      log(info("Iniciando transacción para crear contrato y registrar pago..."));
      
      // Se crea un ID para el nuevo contrato
      let nuevoContratoId;

      // Ejecución de la transacción
      await session.withTransaction(async () => {
        // Se arma el objeto del contrato
        const contratoData = createContrato({
          clienteId, planId: planSeleccionado._id, precio: precioFinal,
          duracion_dias: planSeleccionado.duracion_dias
        });

        // Se crea el contrato en la base de datos
        const contratoResult = await this.contratoRepo.create(contratoData, { session });
        nuevoContratoId = contratoResult.insertedId;

        // Se registra la transacción financiera del pago inicial
        const transaccionData = createTransaccion({
            contratoId: nuevoContratoId, clienteId, monto: precioFinal,
            descripcion: `Pago inicial - ${planSeleccionado.nombre}`
        });
        await this.transaccionRepo.create(transaccionData, { session });
        
        // Si se aceptó añadir un plan nutricional, crearlo también
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

      // Si todo va bien, confirmar y mostrar mensaje de éxito
      let mensajeExito = `\n¡Transacción completada! Contrato creado con ID: ${nuevoContratoId}`;

      // Mensaje adicional si se creó un plan nutricional
      if (anadirPlanNutricional && comidas.length > 0) {
        mensajeExito += `\nTambién se ha creado el plan nutricional con ${comidas.length} comida(s).`;
      }
      log(success(mensajeExito));

      // En caso de error
    } catch (err) {
      log(error(`\nLa transacción ha fallado y se ha revertido: ${err.message}`));

      // Finalmente, cerrar la sesión
    } finally {
      await session.endSession();
      log(info("Sesión de transacción cerrada."));
    }
  }
}