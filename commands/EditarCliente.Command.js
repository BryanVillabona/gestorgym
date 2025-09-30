import inquirer from 'inquirer';
import Command from './Command.js';
import { success, log, error, info, warn } from '../utils/logger.js';
import database from '../config/mongodb.js';
import ClienteRepository from '../repositories/ClienteRepository.js';
import { updateCliente } from '../models/Cliente.js';
import ContratoRepository from '../repositories/ContratoRepository.js';

export default class EditarClienteCommand extends Command {
  constructor() {
    super();
    this.clienteRepository = new ClienteRepository();
    this.contratoRepository = new ContratoRepository();
  }
  
  async execute() {
    log('--- Editar Información de Cliente ---');
    try {
      const clientes = await this.clienteRepository.findAll();
      if (clientes.length === 0) {
        log(info('No hay clientes para editar.'));
        return;
      }

      const { clienteId } = await inquirer.prompt({
        type: 'list',
        name: 'clienteId',
        message: 'Selecciona el cliente que deseas editar:',
        choices: clientes.map(cliente => ({ name: cliente.nombre, value: cliente._id })),
      });

      const clienteExistente = clientes.find(c => c._id.equals(clienteId));

      const answers = await inquirer.prompt([
        { type: 'input', name: 'nombre', message: 'Nuevo nombre:', default: clienteExistente.nombre },
        { type: 'input', name: 'email', message: 'Nuevo correo electrónico:', default: clienteExistente.email },
        { type: 'input', name: 'telefono', message: 'Nuevo teléfono:', default: clienteExistente.telefono },
        { 
          type: 'confirm', 
          name: 'activo', 
          message: '¿El cliente está activo?', 
          default: clienteExistente.activo 
        },
      ]);

      const clienteActualizado = updateCliente(clienteExistente, answers);
      
      if (clienteExistente.activo === true && answers.activo === false) {
        
        const { confirmar } = await inquirer.prompt({
          type: 'confirm',
          name: 'confirmar',
          message: warn('ADVERTENCIA: Desactivar este cliente cancelará automáticamente todos sus contratos activos. ¿Deseas continuar?'),
          default: false,
        });

        if (!confirmar) {
          log(info('Operación cancelada. El cliente no ha sido modificado.'));
          return;
        }

        // Si se confirma, procedemos con una transacción
        const mongoClient = database.getMongoClient();
        const session = mongoClient.startSession();

        try {
          let updatedContractsCount = 0;
          await session.withTransaction(async () => {
            // Operación A: Actualizar el cliente
            await this.clienteRepository.update(clienteId, clienteActualizado, { session });
            // Operación B: Cancelar sus contratos activos
            const result = await this.contratoRepository.cancelActiveContractsByClientId(clienteId, { session });
            updatedContractsCount = result.modifiedCount;
          });
          log(success('\nCliente desactivado exitosamente.'));
          if (updatedContractsCount > 0) {
            log(info(`${updatedContractsCount} contrato(s) activo(s) han sido cancelados.`));
          }
        } catch (transactionError) {
          log(error(`\nLa operación ha fallado y se ha revertido: ${transactionError.message}`));
        } finally {
          await session.endSession();
        }

      } else {
        await this.clienteRepository.update(clienteId, clienteActualizado);
        log(success('\nCliente actualizado exitosamente.'));
      }

    } catch (err) {
      log(error(`Error al editar el cliente: ${err.message}`));
    }
  }
}