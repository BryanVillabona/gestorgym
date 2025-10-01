import Command from './Command.js';
import { log, info, error } from '../utils/logger.js';
import EntrenadorRepository from '../repositories/EntrenadorRepository.js';
import Table from 'cli-table3';

export default class ListarEntrenadoresCommand extends Command {
  constructor() {
    super();
    this.entrenadorRepository = new EntrenadorRepository();
  }

  async execute() {
    log('--- Listado de Entrenadores ---');
    try {
      const entrenadores = await this.entrenadorRepository.findAll();

      if (entrenadores.length === 0) {
        log(info('No hay entrenadores registrados en el sistema.'));
        return;
      }
      
      const table = new Table({
        head: ['ID', 'Nombre'],
      });

      entrenadores.forEach(entrenador => {
        table.push([
          entrenador._id.toString(),
          entrenador.nombre,
        ]);
      });

      log(table.toString());

    } catch(err) {
      log(error(`Error al listar los entrenadores: ${err.message}`));
    }
  }
}