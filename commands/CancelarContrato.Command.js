// Importaciones de módulos y dependencias
import inquirer from 'inquirer';
import Command from './Command.js';
import { success, log, error, info, warn } from '../utils/logger.js';
import database from '../config/mongodb.js';
import ContratoRepository from '../repositories/ContratoRepository.js';
import TransaccionRepository from '../repositories/TransaccionRepository.js';
import { createTransaccion } from '../models/TransaccionFinanciera.js';

// Creación del comando para cancelar un contrato
export default class CancelarContratoCommand extends Command {
  constructor() {

    // Inicialización de repositorios
    super();
    this.contratoRepo = new ContratoRepository();
    this.transaccionRepo = new TransaccionRepository();
  }

  // Ejecución del comando
  async execute() {
    log('--- Cancelar un Contrato Activo ---');

    // Intenta realizar el proceso de cancelación
    try {
      
      // Se seleccionan los contratos activos
      const contratosActivos = await this.contratoRepo.findActivosConInfo();

      // Si no hay contratos activos, salir
      if (contratosActivos.length === 0) {
        info("No hay contratos activos para cancelar.");
        return;
      }

      // Se pide al usuario seleccionar el contrato a cancelar
      const { contratoSeleccionado } = await inquirer.prompt({
        type: 'list',
        name: 'contratoSeleccionado',
        message: 'Selecciona el contrato que deseas cancelar:',
        choices: contratosActivos.map(c => ({
          name: `${c.clienteInfo.nombre} - Plan: ${c.planInfo.nombre} ($${c.precio})`,
          value: c
        })),
      });

      // Confirmar la cancelación
      const { confirmar } = await inquirer.prompt({
        type: 'confirm',
        name: 'confirmar',
        message: `¿Estás seguro de que quieres cancelar este contrato? Esta acción no se puede deshacer.`,
        default: false,
      });

      // Si el usario no confirma, salir
      if (!confirmar) {
        info("Cancelación abortada por el usuario.");
        return;
      }

      // Se pregunta al usuario si desea generar el reembolso
      const { generarReembolso } = await inquirer.prompt({
          type: 'confirm',
          name: 'generarReembolso',
          message: `¿Deseas generar una transacción de egreso (reembolso) por $${contratoSeleccionado.precio} asociada a esta cancelación?`,
          default: false,
      });

      // Inicio de la transacción 
      // Obtener el cliente MongoDB y la sesión
      const mongoClient = database.getMongoClient();
      const session = mongoClient.startSession();

      // Intenta realizar la transacción
      try {
        await session.withTransaction(async () => {
          // Se actualiza el estado del contrato a 'cancelado'
          await this.contratoRepo.updateStatus(contratoSeleccionado._id, 'cancelado', { session });

          // Si el usuario ha deseado un reembolso se genera
          if (generarReembolso) {

            // Se crea la transacción de reembolso
            const reembolso = createTransaccion({

              // Datos de la transacción de reembolso
              contratoId: contratoSeleccionado._id,
              clienteId: contratoSeleccionado.clienteId,
              monto: contratoSeleccionado.precio, // El monto es positivo
              descripcion: `Reembolso por cancelación - ${contratoSeleccionado.planInfo.nombre}`
            });
            // Se sobreescribe el tipo de transacción a 'egreso'
            reembolso.tipo = 'egreso';

            // Se crea la transacción en la base de datos
            await this.transaccionRepo.create(reembolso, { session });
          }
        });

        // Confirmación de éxito
        log(success('\nEl contrato ha sido cancelado exitosamente.'));

        // Mensaje adicional si se generó un reembolso
        if (generarReembolso) {
            log(success('Se ha registrado la transacción de reembolso correspondiente.'));
        }

        // En caso de error
      } catch (err) {
        throw err; // Re-lanzar para que el catch exterior lo maneje

        // Finalmente, cerrar la sesión
      } finally {
        await session.endSession();
      }

      // En caso de error en el proceso general
    } catch (err) {
      log(error(`\nError durante la cancelación. La transacción ha sido revertida: ${err.message}`));
    }
  }
}