import inquirer from "inquirer";
import { ObjectId } from 'mongodb';
import Command from './Command.js';
import { success, log, error, info } from '../utils/logger.js';
import PlanEntrenamientoRepository from '../repositories/PlanEntrenamientoRepository.js';

export default class EliminarPlanCommand extends Command {
    constructor() {
        super();
        this.planRepository = new PlanEntrenamientoRepository();
    }

    async execute() {
        log('--- Eliminar Plan de entrenamiento ---');
        try {
            const planes = await this.planRepository.findAll();
            if (planes.length === 0) {
                info("No hay planes de entrenamiento registrados para eliminar.");
                return;
            }

            const { planId } = await inquirer.prompt({
                type: 'list',
                name: 'planId',
                message: 'Selecciona el plan de entrenamiento que deseas eliminar:',
                choices: planes.map(p => ({ name: `${p.nombre} (${p.metas})`, value: p._id })),
            })

            const { confirm } = await inquirer.prompt({
                type: "confirm",
                name: "confirm",
                message: 'Seguro que deseas eliminar el plan? \nPresione "Enter" para confirmar'
            })

            if (confirm) {
                const result = await this.planRepository.delete(planId);
                log(success(`\nPlan de entrenamiento eliminado exitosamente. Documentos eliminados: ${result.deletedCount}`));
            } else {
                log(info('Operación cancelada.'));
            }
        } catch (error) {
            log(error(`Error al eliminar el plan: ${err.message}`));
        }
    }
}