import inquirer from 'inquirer';
import Command from './Command.js';
import { success, log, error, info } from '../utils/logger.js';
import ContratoRepository from '../repositories/ContratoRepository.js';
import SeguimientoRepository from '../repositories/SeguimientoRepository.js';
import { createSeguimiento } from '../models/Seguimiento.js';

export default class RegistrarAvanceCommand extends Command {
  constructor() {
    super();
    this.contratoRepo = new ContratoRepository();
    this.seguimientoRepo = new SeguimientoRepository();
  }

  async execute() {
    log('--- Registrar Avance Físico de Cliente ---');
    try {
      // 1. Obtener todos los contratos activos
      const contratosActivos = await this.contratoRepo.findActivosConInfo();
      if (contratosActivos.length === 0) {
        log(info("No hay contratos activos para registrar avances."));
        return;
      }
      
      // Paso A: Crear una lista de CLIENTES únicos a partir de los contratos activos.
      const clientesUnicosMap = new Map();
      contratosActivos.forEach(contrato => {
        clientesUnicosMap.set(contrato.clienteInfo._id.toString(), contrato.clienteInfo.nombre);
      });
      const clientesChoices = Array.from(clientesUnicosMap.entries()).map(([id, nombre]) => ({ name: nombre, value: id }));

      // Paso B: Pedir al usuario que seleccione un CLIENTE.
      const { clienteIdStr } = await inquirer.prompt({
        type: 'list',
        name: 'clienteIdStr',
        message: 'Selecciona el CLIENTE para registrar el avance:',
        choices: clientesChoices,
      });

      // Paso C: Filtrar los contratos para mostrar solo los de ese cliente.
      const contratosDelCliente = contratosActivos.filter(
        c => c.clienteInfo._id.toString() === clienteIdStr
      );
      
      let contratoId;
      // Si el cliente solo tiene un contrato activo, lo seleccionamos automáticamente.
      if (contratosDelCliente.length === 1) {
          contratoId = contratosDelCliente[0]._id;
          log(info(`Contrato con el plan "${contratosDelCliente[0].planInfo.nombre}" seleccionado automáticamente.`));
      } else {
          // Si tiene varios, pedimos que elija el CONTRATO específico.
          const { selectedContratoId } = await inquirer.prompt({
              type: 'list',
              name: 'selectedContratoId',
              message: 'Este cliente tiene varios contratos activos. Selecciona uno:',
              choices: contratosDelCliente.map(c => ({
                  name: `Plan: ${c.planInfo.nombre} (Vence: ${new Date(c.fechaFin).toLocaleDateString()})`,
                  value: c._id
              }))
          });
          contratoId = selectedContratoId;
      }

      // 3. Solicitar las métricas de seguimiento (esta parte no cambia)
      const isNumericOrEmpty = (v) => v === '' || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0);
      const answers = await inquirer.prompt([
        { type: 'input', name: 'peso_kg', message: 'Peso actual (kg):', validate: (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0 || 'Introduce un peso válido.' },
        { type: 'input', name: 'grasa_corporal_porcentaje', message: 'Grasa corporal (%):', validate: isNumericOrEmpty },
        { type: 'input', name: 'medida_pecho', message: 'Medida - Pecho (cm):', validate: isNumericOrEmpty },
        { type: 'input', name: 'medida_brazo', message: 'Medida - Brazo (cm):', validate: isNumericOrEmpty },
        { type: 'input', name: 'medida_cintura', message: 'Medida - Cintura (cm):', validate: isNumericOrEmpty },
        { type: 'input', name: 'medida_pierna', message: 'Medida - Pierna (cm):', validate: isNumericOrEmpty },
        { type: 'input', name: 'fotos_urls_str', message: 'URLs de las fotos (separadas por coma):' },
        { type: 'input', name: 'comentarios', message: 'Comentarios del entrenador:' }
      ]);

      // 4. Crear y guardar el registro de seguimiento (esta parte no cambia)
      const seguimientoData = createSeguimiento({
        contratoId,
        peso_kg: answers.peso_kg,
        grasa_corporal_porcentaje: answers.grasa_corporal_porcentaje,
        comentarios: answers.comentarios,
        fotos_urls_str: answers.fotos_urls_str,
        medidas: {
            pecho: answers.medida_pecho,
            brazo: answers.medida_brazo,
            cintura: answers.medida_cintura,
            pierna: answers.medida_pierna,
        }
      });
      
      const result = await this.seguimientoRepo.create(seguimientoData);
      log(success(`\nAvance registrado exitosamente con ID: ${result.insertedId}`));
    } catch (err) {
      log(error(`Error al registrar el avance: ${err.message}`));
    }
  }
}