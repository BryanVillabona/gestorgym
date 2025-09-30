import inquirer from 'inquirer';
import Command from './Command.js';
import { success, log, error, info } from '../utils/logger.js';
import ContratoRepository from '../repositories/ContratoRepository.js';

export default class FinalizarContratosCommand extends Command {
  constructor() {
    super();
    this.contratoRepo = new ContratoRepository();
  }

  async execute() {
    log('--- Finalizar Contratos Vencidos ---');
    try {
      // 1. Buscar todos los contratos que están activos pero ya vencieron
      const contratosVencidos = await this.contratoRepo.findVencidosActivos();

      if (contratosVencidos.length === 0) {
        info("No se encontraron contratos activos que hayan vencido. ¡Todo está al día!");
        return;
      }

      log("Se encontraron los siguientes contratos vencidos:");
      contratosVencidos.forEach(c => {
        log(`- Cliente: ${c.clienteInfo.nombre}, Plan: ${c.planInfo.nombre}`);
      });
      log('');

      // 2. Pedir confirmación para actualizarlos todos
      const { confirmar } = await inquirer.prompt({
        type: 'confirm',
        name: 'confirmar',
        message: `¿Deseas cambiar el estado de estos ${contratosVencidos.length} contratos a "finalizado"?`,
        default: true,
      });

      if (!confirmar) {
        log(info("Operación cancelada por el usuario."));
        return;
      }

      // 3. Ejecutar la actualización masiva
      const idsParaActualizar = contratosVencidos.map(c => c._id);
      const result = await this.contratoRepo.updateManyStatus(idsParaActualizar, 'finalizado');

      log(success(`\nOperación completada. Se actualizaron ${result.modifiedCount} contratos.`));

    } catch (err) {
      log(error(`Error al finalizar contratos: ${err.message}`));
    }
  }
}