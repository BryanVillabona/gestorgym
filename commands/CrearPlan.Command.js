import inquirer from 'inquirer';
import Command from './Command.js';
import { success, log, error } from '../utils/logger.js';
import { createPlanEntrenamiento } from '../models/PlanEntrenamiento.js';
import PlanEntrenamientoRepository from '../repositories/PlanEntrenamientoRepository.js';

export default class CrearPlanCommand extends Command {
  constructor() {
    super();
    this.planRepository = new PlanEntrenamientoRepository();
  }
  
  async execute() {
    log('--- Nuevo Plan de Entrenamiento ---');
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'nombre',
          message: 'Nombre del plan:',
          validate: (value) => value.length > 0 ? true : 'El nombre no puede estar vacío.',
        },
        {
          type: 'input',
          name: 'duracion_dias',
          message: 'Duración total (en días):',
          validate: (value) => {
            const num = parseInt(value, 10);
            return !isNaN(num) && num > 0 ? true : 'Por favor, introduce un número de días válido y positivo.';
          },
        },
        {
          type: 'input',
          name: 'metas',
          message: 'Metas del plan:',
          validate: (value) => value.length > 0 ? true : 'Las metas no pueden estar vacías.',
        },
        {
          type: 'list',
          name: 'nivel',
          message: 'Nivel del plan:',
          choices: ['principiante', 'intermedio', 'avanzado'],
        },
        {
          type: 'input',
          name: 'precio_sugerido',
          message: 'Precio sugerido (ej: 10000.00):',
          validate: (value) => {
            const num = parseFloat(value);
            return !isNaN(num) && num >= 0 ? true : 'Por favor, introduce un precio válido.';
          },
        }
      ]);
      
      const nuevoPlan = createPlanEntrenamiento(answers);
      const result = await this.planRepository.create(nuevoPlan);

      log(success(`\nPlan de entrenamiento creado exitosamente con ID: ${result.insertedId}`));
    } catch (err) {
      log(error(`Error al crear el plan: ${err.message}`));
    }
  }
}