import inquirer from 'inquirer';
import Command from './Command.js';
import { success, log, error } from '../utils/logger.js';
import { createEntrenador } from '../models/Entrenador.js';
import EntrenadorRepository from '../repositories/EntrenadorRepository.js';

export default class CrearEntrenadorCommand extends Command {
  constructor() {
    super();
    this.entrenadorRepository = new EntrenadorRepository();
  }
  
  async execute() {
    log('--- Registrar Nuevo Entrenador ---');
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'nombre',
          message: 'Nombre completo del entrenador:',
          validate: (value) => value.trim().length > 0 ? true : 'El nombre no puede estar vacío.',
        },
      ]);
      
      const nuevoEntrenador = createEntrenador(answers);
      const result = await this.entrenadorRepository.create(nuevoEntrenador);

      log(success(`\nEntrenador registrado exitosamente con ID: ${result.insertedId}`));
    } catch (err) {
      log(error(`Error al crear el entrenador: ${err.message}`));
    }
  }
}