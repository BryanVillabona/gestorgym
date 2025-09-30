import Command from './Command.js';
import { log, info, error } from '../utils/logger.js';
import ClienteRepository from '../repositories/ClienteRepository.js';
import Table from 'cli-table3'; // <-- Importamos la librería

export default class ListarClientesCommand extends Command {
  constructor() {
    super();
    this.clienteRepository = new ClienteRepository();
  }

  async execute() {
    log('--- Listado de Clientes ---');
    try {
      const clientes = await this.clienteRepository.findAll();

      if (clientes.length === 0) {
        log(info('No hay clientes registrados en la base de datos.'));
        return;
      }
      
      // Creamos una nueva instancia de la tabla con sus encabezados
      const table = new Table({
        head: ['ID', 'Nombre', 'Email', 'Teléfono', 'Activo'],
        colWidths: [26, 25, 30, 15, 10] // Anchos de columna para mejor visualización
      });

      // Llenamos la tabla con los datos de cada cliente
      clientes.forEach(cliente => {
        table.push([
          cliente._id.toString(),
          cliente.nombre,
          cliente.email,
          cliente.telefono,
          cliente.activo ? 'Sí' : 'No'
        ]);
      });

      // Imprimimos la tabla completa en la consola
      log(table.toString());

    } catch(err) {
      log(error(`Error al listar los clientes: ${err.message}`));
    }
  }
}