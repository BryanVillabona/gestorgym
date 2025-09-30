import Command from './Command.js';
import { log, info, error } from '../utils/logger.js';
import PlanEntrenamientoRepository from '../repositories/PlanEntrenamientoRepository.js';
import Table from 'cli-table3';

export default class ListarPlanesCommand extends Command {
  constructor() {
    super();
    this.planRepository = new PlanEntrenamientoRepository();
  }

  async execute() {
    log('--- Listado de Planes de Entrenamiento ---');
    try {
      const planes = await this.planRepository.findAll();

      if (planes.length === 0) {
        log(info('No hay planes de entrenamiento registrados.'));
        return;
      }
      
      const table = new Table({
        head: ['Nombre', 'Duración', 'Nivel', 'Precio Sugerido']
      });

      planes.forEach(plan => {
        table.push([
          plan.nombre,
          `${plan.duracion_dias} días`,
          plan.nivel,
          `$${plan.precio_sugerido.toLocaleString('es-CO')}` // Formato de moneda colombiana
        ]);
      });

      log(table.toString());

    } catch(err) {
      log(error(`Error al listar los planes: ${err.message}`));
    }
  }
}