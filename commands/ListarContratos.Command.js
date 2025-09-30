import Command from './Command.js';
import { log, info, error, success } from '../utils/logger.js';
import ContratoRepository from '../repositories/ContratoRepository.js';
import ClienteRepository from '../repositories/ClienteRepository.js';
import dayjs from 'dayjs';
import Table from 'cli-table3';
import inquirer from 'inquirer';

export default class ListarContratosCommand extends Command {
  constructor() {
    super();
    this.contratoRepo = new ContratoRepository();
    this.clienteRepo = new ClienteRepository();
  }

  async execute() {
    log('--- Listado de Contratos ---');
    try {
      const { filtro } = await inquirer.prompt({
        type: 'list',
        name: 'filtro',
        message: '¿Cómo deseas listar los contratos?',
        choices: [
          { name: 'Mostrar historial completo', value: 'todos' },
          { name: 'Filtrar por cliente específico', value: 'porCliente' },
        ]
      });

      let contratos = [];
      let titulo = '';

      if (filtro === 'todos') {
        titulo = '--- Listado Completo de Contratos ---';
        const todosLosContratos = await this.contratoRepo.findAllConInfo();
        // Para la vista completa, necesitamos el nombre del cliente
        contratos = todosLosContratos.map(c => ({ ...c, nombreCliente: c.clienteInfo.nombre }));

      } else if (filtro === 'porCliente') {
        const clientes = await this.clienteRepo.findAll();
        if (clientes.length === 0) {
          log(info('No hay clientes registrados.'));
          return;
        }
        const { clienteId } = await inquirer.prompt({
          type: 'list', name: 'clienteId', message: 'Selecciona un cliente:',
          choices: clientes.map(c => ({ name: c.nombre, value: c._id })),
        });

        const clienteSeleccionado = clientes.find(c => c._id.equals(clienteId));
        titulo = `--- Contratos de: ${clienteSeleccionado.nombre} ---`;
        const contratosCliente = await this.contratoRepo.findByClientIdConInfo(clienteId);
        // El nombre del cliente es el mismo para todos
        contratos = contratosCliente.map(c => ({ ...c, nombreCliente: clienteSeleccionado.nombre }));
      }

      if (contratos.length === 0) {
        log(info('No se encontraron contratos para la selección actual.'));
        return;
      }

      log(`\n${titulo}`);
      const table = new Table({
        head: ['Cliente', 'Plan', 'F. Inicio', 'F. Fin', 'Precio', 'Estado']
      });

      contratos.forEach(contrato => {
        let estadoFormateado;
        switch (contrato.estado) {
          case 'activo':
            estadoFormateado = success(contrato.estado);
            break;
          case 'cancelado':
            estadoFormateado = error(contrato.estado);
            break;
          case 'renovado': // Le damos un color especial
            estadoFormateado = info(contrato.estado);
            break;
          default: // 'finalizado' y otros
            estadoFormateado = contrato.estado;
        }

        table.push([
          contrato.nombreCliente,
          contrato.planInfo.nombre,
          dayjs(contrato.fechaInicio).format('YYYY-MM-DD'),
          dayjs(contrato.fechaFin).format('YYYY-MM-DD'),
          `$${contrato.precio.toLocaleString('es-CO')}`,
          estadoFormateado
        ]);
      });

      log(table.toString());

    } catch (err) {
      log(error(`Error al listar los contratos: ${err.message}`));
    }
  }
}