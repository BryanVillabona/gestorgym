import inquirer from 'inquirer';
import Command from './Command.js';
import { success, log, error, info } from '../utils/logger.js';
import database from '../config/mongodb.js';
import ContratoRepository from '../repositories/ContratoRepository.js';
import TransaccionRepository from '../repositories/TransaccionRepository.js';
import EntrenadorRepository from '../repositories/EntrenadorRepository.js'; 
import { createContrato } from '../models/Contrato.js';
import { createTransaccion } from '../models/TransaccionFinanciera.js';

export default class RenovarContratoCommand extends Command {
  constructor() {
    super();
    this.contratoRepo = new ContratoRepository();
    this.transaccionRepo = new TransaccionRepository();
    this.entrenadorRepo = new EntrenadorRepository();
  }

  async execute() {
    log('--- Renovar un Contrato ---');
    try {
      // 1. Obtener contratos que se pueden renovar (activos o finalizados)
      const contratosRenovables = await this.contratoRepo.findRenovablesConInfo();
      if (contratosRenovables.length === 0) {
        info("No hay contratos activos o finalizados para renovar.");
        return;
      }
      const { contratoAnterior } = await inquirer.prompt({
        type: 'list',
        name: 'contratoAnterior',
        message: 'Selecciona el contrato que deseas renovar:',
        choices: contratosRenovables.map(c => ({
          name: `${c.clienteInfo.nombre} - Plan: ${c.planInfo.nombre} (Vence: ${new Date(c.fechaFin).toLocaleDateString()})`,
          value: c
        })),
      });

      // 2. Proponer el precio actual del plan y permitir ajustarlo
      const precioSugeridoActual = contratoAnterior.planInfo.precio_sugerido;
      const { precioFinal } = await inquirer.prompt({
          type: 'input',
          name: 'precioFinal',
          message: `El precio sugerido actual del plan es $${precioSugeridoActual.toFixed(2)}. Introduce el precio para el nuevo periodo:`,
          default: precioSugeridoActual,
          validate: (v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0 ? true : 'Introduce un precio válido.',
      });

      log(info('\nAsignar Entrenador (Opcional)'));
      const entrenadores = await this.entrenadorRepo.findAll();
      const choicesEntrenadores = [
          { name: 'No asignar entrenador ahora', value: null },
          new inquirer.Separator(),
          ...entrenadores.map(e => ({ name: e.nombre, value: e._id }))
      ];
      const { entrenadorId } = await inquirer.prompt({
          type: 'list', name: 'entrenadorId', message: '¿Asignar un entrenador a este nuevo contrato?',
          choices: choicesEntrenadores
      });

      // 3. Iniciar la transacción
      const mongoClient = database.getMongoClient();
      const session = mongoClient.startSession();
      let nuevoContratoId;

      try {
        await session.withTransaction(async () => {
          // Operación A: Actualizar el estado del CONTRATO ANTIGUO a "renovado".
          await this.contratoRepo.updateStatus(contratoAnterior._id, 'renovado', { session });

          // Operación B: Crear el NUEVO contrato, enlazándolo al anterior.
          const nuevoContratoData = createContrato({
            clienteId: contratoAnterior.clienteId,
            planId: contratoAnterior.planId,
            precio: precioFinal,
            duracion_dias: contratoAnterior.planInfo.duracion_dias,
            renuevaContratoId: contratoAnterior._id,
            entrenadorId: entrenadorId 
          });
          const contratoResult = await this.contratoRepo.create(nuevoContratoData, { session });
          nuevoContratoId = contratoResult.insertedId;

          // Operación C: Crear la transacción de ingreso para el nuevo contrato.
          const transaccionData = createTransaccion({
              contratoId: nuevoContratoId,
              clienteId: contratoAnterior.clienteId,
              monto: precioFinal,
              descripcion: `Pago por renovación - ${contratoAnterior.planInfo.nombre}`
          });
          await this.transaccionRepo.create(transaccionData, { session });
        });
        log(success(`\nContrato renovado exitosamente. Nuevo ID de contrato: ${nuevoContratoId}`));

      } catch (err) {
        throw err;
      } finally {
        await session.endSession();
      }
    } catch (err) {
      log(error(`\nError durante la renovación. La transacción ha sido revertida: ${err.message}`));
    }
  }
}