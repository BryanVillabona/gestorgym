import inquirer from 'inquirer';
import Command from './Command.js';
import { success, log, error, info, warn } from '../utils/logger.js';
import ContratoRepository from '../repositories/ContratoRepository.js';
import SeguimientoRepository from '../repositories/SeguimientoRepository.js';
import dayjs from 'dayjs';

export default class GestionarAvanceCommand extends Command {
  constructor() {
    super();
    this.contratoRepo = new ContratoRepository();
    this.seguimientoRepo = new SeguimientoRepository();
  }

  async execute() {
    log('--- Gestionar Registros de Avance ---');
    try {
      // 1. Seleccionar el contrato
      const contratosActivos = await this.contratoRepo.findActivosConInfo();
      if (contratosActivos.length === 0) {
        info("No hay contratos activos para gestionar.");
        return;
      }
      const { contratoId } = await inquirer.prompt({
        type: 'list',
        name: 'contratoId',
        message: 'Selecciona el contrato del cliente:',
        choices: contratosActivos.map(c => ({ name: `${c.clienteInfo.nombre} - Plan: ${c.planInfo.nombre}`, value: c._id })),
      });

      // 2. Seleccionar el registro de avance específico
      const historial = await this.seguimientoRepo.findByContratoId(contratoId);
      if (historial.length === 0) {
        info(`No hay registros de progreso para este contrato.`);
        return;
      }
      const { registroId } = await inquirer.prompt({
        type: 'list',
        name: 'registroId',
        message: 'Selecciona el registro de avance que deseas gestionar:',
        choices: historial.map(r => ({
          name: `Fecha: ${dayjs(r.fecha).format('YYYY-MM-DD')} - Peso: ${r.peso_kg}kg - Estado: ${r.estado}`,
          value: r._id,
        })),
      });
      
      // 3. Elegir la acción: Cancelar o Eliminar
      const { accion } = await inquirer.prompt({
          type: 'list',
          name: 'accion',
          message: '¿Qué acción deseas realizar sobre este registro?',
          choices: [
              { name: 'Cancelar (marcar como inválido, se mantiene en el historial)', value: 'cancelar' },
              { name: 'Eliminar Permanentemente (acción irreversible)', value: 'eliminar' },
              new inquirer.Separator(),
              { name: 'Volver', value: 'volver'},
          ]
      });

      if (accion === 'cancelar') {
        await this.seguimientoRepo.updateStatus(registroId, 'cancelado');
        success('El registro de avance ha sido cancelado.');
      } else if (accion === 'eliminar') {
        const { confirmar } = await inquirer.prompt({
            type: 'confirm',
            name: 'confirmar',
            message: warn('ADVERTENCIA: Estás a punto de eliminar este registro permanentemente. ¿Deseas continuar?'),
            default: false,
        });
        if (confirmar) {
            await this.seguimientoRepo.deleteById(registroId);
            success('El registro de avance ha sido eliminado permanentemente.');
        } else {
            info('Eliminación cancelada.');
        }
      }

    } catch (err) {
      log(error(`Error al gestionar el registro de avance: ${err.message}`));
    }
  }
}