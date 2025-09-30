import inquirer from 'inquirer';
import Command from './Command.js';
import { success, log, error, info } from '../utils/logger.js';
import PlanEntrenamientoRepository from '../repositories/PlanEntrenamientoRepository.js';
import { updatePlanEntrenamiento } from '../models/PlanEntrenamiento.js';
import { ObjectId } from 'mongodb';

export default class EditarPlanCommand extends Command {
  constructor() {
    super();
    this.planRepository = new PlanEntrenamientoRepository();
  }
  
  async execute() {
    log('--- Editar Plan de Entrenamiento ---');
    try {
      const planes = await this.planRepository.findAll();
      if (planes.length === 0) {
        info('No hay planes de entrenamiento para editar.');
        return;
      }

      const { planId } = await inquirer.prompt({
        type: 'list',
        name: 'planId',
        message: 'Selecciona el plan de entrenamiento que deseas editar:',
        choices: planes.map(plan => ({
          name: `${plan.nombre} (${plan.metas})`,
          value: plan._id,
        })),
      });

      const planExistente = planes.find(p => p._id.equals(planId));

      const answers = await inquirer.prompt([
        { type: 'input', name: 'nombre', message: 'Nombre del plan:', default: planExistente.nombre },
        { type: 'input', name: 'duracion_dias', message: 'Duración (en días):', default: planExistente.duracion_dias },
        { type: 'input', name: 'metas', message: 'Metas del plan:', default: planExistente.metas },
        { type: 'list', name: 'nivel', message: 'Nivel de dificultad:', choices: ['principiante', 'intermedio', 'avanzado'], default: planExistente.nivel },
        { type: 'input', name: 'precio_sugerido', message: 'Precio sugerido (ej: 10000.00):', default: planExistente.precio_sugerido },
      ]);

      const planActualizado = updatePlanEntrenamiento(planExistente, answers);

      await this.planRepository.update(planId, planActualizado);
      log(success('\nPlan de entrenamiento actualizado exitosamente.'));
    } catch (err) {
      log(error(`Error al editar el plan de entrenamiento: ${err.message}`));
    }
  }
}