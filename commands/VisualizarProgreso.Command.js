import inquirer from 'inquirer';
import Command from './Command.js';
import { log, info, error, success, warn } from '../utils/logger.js';
import ContratoRepository from '../repositories/ContratoRepository.js';
import SeguimientoRepository from '../repositories/SeguimientoRepository.js';
import dayjs from 'dayjs';
import Table from 'cli-table3';

export default class VisualizarProgresoCommand extends Command {
  constructor() {
    super();
    this.contratoRepo = new ContratoRepository();
    this.seguimientoRepo = new SeguimientoRepository();
  }

  async execute() {
    log('--- Visualizar Historial de Progreso de Cliente ---');
    try {
      // 1. Obtener solo los contratos que tienen registros de seguimiento
      const contratosConSeguimiento = await this.contratoRepo.findActivosConSeguimiento();

      if (contratosConSeguimiento.length === 0) {
        log(info("No hay clientes con registros de progreso para mostrar."));
        return;
      }

      // Paso A: Crear una lista de CLIENTES únicos a partir de los contratos encontrados
      const clientesUnicosMap = new Map();
      contratosConSeguimiento.forEach(contrato => {
        clientesUnicosMap.set(contrato.clienteInfo._id.toString(), contrato.clienteInfo.nombre);
      });
      const clientesChoices = Array.from(clientesUnicosMap.entries()).map(([id, nombre]) => ({ name: nombre, value: id }));
      
      // Paso B: Pedir al usuario que seleccione un CLIENTE
      const { clienteIdStr } = await inquirer.prompt({
        type: 'list',
        name: 'clienteIdStr',
        message: 'Selecciona el CLIENTE para ver su progreso:',
        choices: clientesChoices,
      });

      // Paso C: Filtrar para mostrar solo los CONTRATOS de ese cliente
      const contratosDelCliente = contratosConSeguimiento.filter(
        c => c.clienteInfo._id.toString() === clienteIdStr
      );
      
      let contratoSeleccionado;
      if (contratosDelCliente.length === 1) {
          contratoSeleccionado = contratosDelCliente[0];
      } else {
          const { selectedContrato } = await inquirer.prompt({
              type: 'list', name: 'selectedContrato', message: 'Selecciona el CONTRATO específico:',
              choices: contratosDelCliente.map(c => ({
                  name: `Plan: ${c.planInfo.nombre} (Vence: ${dayjs(c.fechaFin).format('YYYY-MM-DD')})`,
                  value: c
              }))
          });
          contratoSeleccionado = selectedContrato;
      }
      
      const historial = await this.seguimientoRepo.findByContratoId(contratoSeleccionado._id);

      log(`\n--- Historial de Progreso para: ${success(contratoSeleccionado.clienteInfo.nombre)} ---`);
      log(`--- Plan: ${info(contratoSeleccionado.planInfo.nombre)} ---`);
      
      const table = new Table({
        head: ['Fecha', 'Peso (kg)', 'Grasa (%)', 'Medidas (cm)', 'Estado', 'Comentarios'],
        wordWrap: true // Activa el ajuste de línea para textos largos
      });

      historial.forEach(registro => {
        // Creamos un string multi-línea para las medidas
        const medidasStr = [
            `Pecho: ${registro.medidas?.pecho || 'N/A'}`,
            `Brazo: ${registro.medidas?.brazo || 'N/A'}`,
            `Cintura: ${registro.medidas?.cintura || 'N/A'}`,
            `Pierna: ${registro.medidas?.pierna || 'N/A'}`
        ].join('\n');
        
        const estadoFormateado = registro.estado === 'valido'
          ? success(registro.estado)
          : warn(registro.estado);

        table.push([
          dayjs(registro.fecha).format('YYYY-MM-DD'),
          registro.peso_kg.toFixed(2),
          registro.grasa_corporal_porcentaje || 'N/A',
          medidasStr,
          estadoFormateado,
          registro.comentarios || ''
        ]);
      });

      log(table.toString());

    } catch (err) {
      log(error(`Error al visualizar el progreso: ${err.message}`));
    }
  }
}