import inquirer from 'inquirer';
import Command from './Command.js';
import { log, info, error, success, warn } from '../utils/logger.js';
import ClienteRepository from '../repositories/ClienteRepository.js';
import PlanNutricionalRepository from '../repositories/PlanNutricionalRepository.js';
import dayjs from 'dayjs';
import Table from 'cli-table3';

export default class ConsultarPlanNutricionalCommand extends Command {
  constructor() {
    super();
    this.clienteRepo = new ClienteRepository();
    this.planNutricionalRepo = new PlanNutricionalRepository();
  }

  async execute() {
    log('--- Consultar Reporte Nutricional Semanal por Cliente ---');
    try {
      // --- PASO 1: SELECCIÓN INTELIGENTE DE CLIENTE ---
      // Usamos el método para obtener SOLO los clientes que tienen al menos un plan.
      const clientesConPlan = await this.clienteRepo.findClientesConPlanNutricional();

      if (clientesConPlan.length === 0) {
        log(info("Ningún cliente tiene planes nutricionales registrados."));
        return;
      }

      const { clienteId } = await inquirer.prompt({
        type: 'list',
        name: 'clienteId',
        message: 'Selecciona el cliente para ver su historial nutricional:',
        choices: clientesConPlan.map(c => ({ name: c.nombre, value: c._id })),
      });
      
      const todosLosPlanes = await this.planNutricionalRepo.findByClientIdConInfo(clienteId);
      const clienteSeleccionado = clientesConPlan.find(c => c._id.equals(clienteId));

      if (todosLosPlanes.length === 0) {
        log(info(`El cliente ${clienteSeleccionado.nombre} no tiene planes nutricionales registrados.`));
        return;
      }

      log(`\n--- Reporte Nutricional para: ${success(clienteSeleccionado.nombre)} ---`);
      
      // --- PASO 2: LÓGICA DE AGRUPACIÓN SEMANAL ---
      const planesPorSemana = {};
      todosLosPlanes.forEach(plan => {
        const fecha = dayjs(plan.fechaRegistro);
        const semanaKey = fecha.startOf('week').format('YYYY-MM-DD');
        if (!planesPorSemana[semanaKey]) {
          planesPorSemana[semanaKey] = [];
        }
        planesPorSemana[semanaKey].push(plan);
      });

      // --- PASO 3: PRESENTACIÓN DEL REPORTE SEMANAL ---
      for (const semanaKey in planesPorSemana) {
        const planesDeLaSemana = planesPorSemana[semanaKey];
        const primeraFecha = dayjs(semanaKey);

        const inicioSemana = primeraFecha.format('DD/MM/YYYY');
        const finSemana = primeraFecha.endOf('week').format('DD/MM/YYYY');
        log(`\n\n${warn(`SEMANA DEL ${inicioSemana} AL ${finSemana}`)}`);

        const table = new Table({
          head: ['Fecha Reg.', 'Plan Nutricional', 'Asociado a', 'Comidas Detalladas'],
          wordWrap: true
        });

        let totalCaloriasSemana = 0;
        let diasConCalorias = 0;

        planesDeLaSemana.forEach(plan => {
          let comidasStr = info('Sin comidas.');
          let totalCaloriasDia = 0;
          
          if (plan.comidas && plan.comidas.length > 0) {
            totalCaloriasDia = plan.comidas.reduce((sum, comida) => sum + (comida.caloriasEstimadas || 0), 0);
            
            comidasStr = plan.comidas.map(comida => {
              const calorias = comida.caloriasEstimadas ? `(${comida.caloriasEstimadas} kcal)` : '(N/A)';
              return `› ${success(comida.nombre)} ${calorias}\n  - ${comida.descripcion || 'N/A'}`;
            }).join('\n\n');
            
            if (totalCaloriasDia > 0) {
              comidasStr += `\n\n${'-'.repeat(25)}\n${warn(`TOTAL DÍA: ${totalCaloriasDia} kcal`)}`;
            }
          }

          if (totalCaloriasDia > 0) {
            totalCaloriasSemana += totalCaloriasDia;
            diasConCalorias++;
          }

          table.push([
            dayjs(plan.fechaRegistro).format('YYYY-MM-DD'),
            `${plan.nombre}\n${info(plan.descripcion)}`,
            plan.planEntrenamientoInfo.nombre,
            comidasStr
          ]);
        });

        log(table.toString());

        const promedioCalorias = diasConCalorias > 0
          ? (totalCaloriasSemana / diasConCalorias).toFixed(0)
          : 0;
        
        log(info(`Resumen de la Semana: Promedio de ${promedioCalorias} kcal/día.`));
      }

    } catch (err) {
      log(error(`Error al consultar el reporte nutricional: ${err.message}`));
    }
  }
}