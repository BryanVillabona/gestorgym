import inquirer from 'inquirer';
import Command from './Command.js';
import { success, log, error } from '../utils/logger.js';
import TransaccionRepository from '../repositories/TransaccionRepository.js';
import ClienteRepository from '../repositories/ClienteRepository.js';
import { createTransaccion } from '../models/TransaccionFinanciera.js';

export default class RegistrarIngresoCommand extends Command {
  constructor() {
    super();
    this.transaccionRepo = new TransaccionRepository();
    this.clienteRepo = new ClienteRepository();
  }

  async execute() {
    log('--- Registrar un Ingreso Vario (Venta) ---');
    try {
      // Opcional: Asociar la venta a un cliente existente
      const clientes = await this.clienteRepo.findAll();
      const choicesClientes = [
        { name: 'No asociar a un cliente (venta general)', value: null },
        new inquirer.Separator(),
        ...clientes.map(c => ({ name: c.nombre, value: c._id }))
      ];

      const { clienteId } = await inquirer.prompt({
        type: 'list',
        name: 'clienteId',
        message: '¿Asociar este ingreso a un cliente existente?',
        choices: choicesClientes,
      });

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'monto',
          message: 'Monto del ingreso (ej: 5.50):',
          validate: (value) => {
            const num = parseFloat(value);
            return !isNaN(num) && num > 0 ? true : 'Por favor, introduce un monto numérico positivo.';
          },
        },
        {
          type: 'input',
          name: 'descripcion',
          message: 'Descripción del ingreso (ej: Venta de batido de proteína):',
          validate: (value) => value.length > 0 ? true : 'La descripción no puede estar vacía.',
        }
      ]);

      // Creamos el DTO usando la factory que ya es flexible
      const transaccionData = createTransaccion({
        clienteId: clienteId, 
        contratoId: null, // No está asociado a un contrato
        monto: answers.monto,
        descripcion: answers.descripcion,
      });
      // El tipo por defecto ya es 'ingreso', así que no necesitamos cambiarlo.

      const result = await this.transaccionRepo.create(transaccionData);
      log(success(`\nIngreso registrado exitosamente con ID: ${result.insertedId}`));

    } catch (err) {
      log(error(`Error al registrar el ingreso: ${err.message}`));
    }
  }
}