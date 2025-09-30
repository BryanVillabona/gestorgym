import inquirer from 'inquirer';
import Command from './Command.js';
import { success, log, error, info } from '../utils/logger.js';
import TransaccionRepository from '../repositories/TransaccionRepository.js';
import ClienteRepository from '../repositories/ClienteRepository.js';

import dayjs from 'dayjs';
import Table from 'cli-table3';

export default class ConsultarBalanceCommand extends Command {
  constructor() {
    super();
    this.transaccionRepo = new TransaccionRepository();
    this.clienteRepo = new ClienteRepository(); // <-- AÑADIR INSTANCIA
  }

  async execute() {
    log('--- Consultar Balance Financiero ---');
    try {
      const { tipoFiltro } = await inquirer.prompt({
        type: 'list',
        name: 'tipoFiltro',
        message: '¿Cómo deseas consultar el balance?',
        choices: [
          { name: 'Historial completo (sin filtros)', value: 'completo' },
          { name: 'Filtrar por rango de fechas', value: 'fecha' },
          { name: 'Filtrar por cliente específico', value: 'cliente' },
        ]
      });

      const options = {};
      let tituloReporte = 'Periodo: Historial completo';
      let clienteSeleccionado = null;

      if (tipoFiltro === 'fecha') {
        const answers = await inquirer.prompt([
            { type: 'input', name: 'inicio', message: 'Fecha de inicio (YYYY-MM-DD):', validate: (v) => dayjs(v).isValid() || 'Introduce una fecha válida.' },
            { type: 'input', name: 'fin', message: 'Fecha de fin (YYYY-MM-DD):', validate: (v) => dayjs(v).isValid() || 'Introduce una fecha válida.' }
        ]);
        options.fechaInicio = dayjs(answers.inicio).startOf('day').toDate();
        options.fechaFin = dayjs(answers.fin).endOf('day').toDate();
        tituloReporte = `Periodo: ${dayjs(options.fechaInicio).format('YYYY-MM-DD')} al ${dayjs(options.fechaFin).format('YYYY-MM-DD')}`;
      } else if (tipoFiltro === 'cliente') {
        const clientes = await this.clienteRepo.findAll();
        if (clientes.length === 0) {
          info('No hay clientes registrados para filtrar.');
          return;
        }
        const { clienteId } = await inquirer.prompt({
            type: 'list',
            name: 'clienteId',
            message: 'Selecciona un cliente:',
            choices: clientes.map(c => ({ name: c.nombre, value: c._id })),
        });
        options.clienteId = clienteId;
        const clienteSeleccionado = clientes.find(c => c._id.equals(clienteId));
        tituloReporte = `Cliente: ${clienteSeleccionado.nombre}`;
      }

      // Llamamos al repositorio con las opciones de filtro
      const resultado = await this.transaccionRepo.getBalance(options);
      
      const totalIngresos = resultado.ingresos || 0;
      const totalEgresos = resultado.egresos || 0;
      const balanceNeto = totalIngresos - totalEgresos;

      log('\n--- Reporte Financiero ---');
      log(tituloReporte);
      log('---------------------------------');
      log(`Total de Ingresos: ${success(`$${totalIngresos.toFixed(2)}`)}`);
      log(`Total de Egresos:  ${error(`$${totalEgresos.toFixed(2)}`)}`);
      log('---------------------------------');
      const balanceColor = balanceNeto >= 0 ? success : error;
      log(`Balance Neto:      ${balanceColor(`$${balanceNeto.toFixed(2)}`)}`);
      log('---------------------------------');

      // Si filtramos por cliente, mostramos el detalle de sus transacciones.
      if (tipoFiltro === 'cliente') {
        const transacciones = await this.transaccionRepo.findByClientId(options.clienteId);
        
        if (transacciones.length > 0) {
            log('\n--- Detalle de Transacciones ---');
            const table = new Table({
                head: ['Fecha', 'Descripción', 'Tipo', 'Monto']
            });
            transacciones.forEach(t => {
                const tipoFormateado = t.tipo === 'ingreso' ? success(t.tipo) : error(t.tipo);
                table.push([
                    dayjs(t.fecha).format('YYYY-MM-DD'),
                    t.descripcion,
                    tipoFormateado,
                    `$${t.monto.toLocaleString('es-CO')}`
                ]);
            });
            log(table.toString());
        } else {
            log(info('Este cliente no tiene transacciones registradas.'));
        }
      }

    } catch (err)      {
      log(error(`Error al consultar el balance: ${err.message}`));
    }
  }
}