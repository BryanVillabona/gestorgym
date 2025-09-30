import inquirer from 'inquirer';
import Command from './Command.js';
import { success, log, error } from '../utils/logger.js';
import TransaccionRepository from '../repositories/TransaccionRepository.js';
import { createTransaccion } from '../models/TransaccionFinanciera.js';

export default class RegistrarEgresoCommand extends Command {
  constructor() {
    super();
    this.transaccionRepo = new TransaccionRepository();
  }

  async execute() {
    log('--- Registrar un Egreso (Gasto) ---');
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'monto',
          message: 'Monto del egreso (ej: 50.99):',
          validate: (value) => {
            const num = parseFloat(value);
            return !isNaN(num) && num > 0 ? true : 'Por favor, introduce un monto numérico positivo.';
          },
        },
        {
          type: 'input',
          name: 'descripcion',
          message: 'Descripción del egreso:',
          validate: (value) => value.length > 0 ? true : 'La descripción no puede estar vacía.',
        }
      ]);

      // Creamos el DTO usando la factory que ya teníamos
      const transaccionData = createTransaccion({
        // No está asociado a un cliente o contrato específico
        clienteId: null, 
        contratoId: null,
        monto: answers.monto,
        descripcion: answers.descripcion,
      });

      // Sobreescribimos el tipo a 'egreso'
      transaccionData.tipo = 'egreso';

      const result = await this.transaccionRepo.create(transaccionData);
      log(success(`\nEgreso registrado exitosamente con ID: ${result.insertedId}`));

    } catch (err) {
      log(error(`Error al registrar el egreso: ${err.message}`));
    }
  }
}