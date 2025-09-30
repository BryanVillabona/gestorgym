import inquirer from 'inquirer';
import Command from './Command.js';
import { success, log, error, info, warn } from '../utils/logger.js';
import ClienteRepository from '../repositories/ClienteRepository.js';
import PlanNutricionalRepository from '../repositories/PlanNutricionalRepository.js';
import dayjs from 'dayjs';

export default class GestionarPlanNutricionalCommand extends Command {
  constructor() {
    super();
    this.clienteRepo = new ClienteRepository();
    this.planNutricionalRepo = new PlanNutricionalRepository();
  }

  async execute() {
    log('--- Gestionar un Plan Nutricional Diario ---');
    try {
      // 1. Seleccionar cliente y plan diario (sin cambios)
      const clientes = await this.clienteRepo.findAll();
      if (clientes.length === 0) { log(info("No hay clientes registrados.")); return; }
      const { clienteId } = await inquirer.prompt({
        type: 'list', name: 'clienteId', message: 'Selecciona el cliente:',
        choices: clientes.map(c => ({ name: c.nombre, value: c._id })),
      });
      
      const planes = await this.planNutricionalRepo.findByClientIdConInfo(clienteId);
      if (planes.length === 0) {
        log(info("Este cliente no tiene planes nutricionales registrados."));
        return;
      }

      const { planSeleccionado } = await inquirer.prompt({
        type: 'list', name: 'planSeleccionado', message: 'Selecciona el plan diario que deseas gestionar:',
        choices: planes.map(p => ({
          name: `${dayjs(p.fechaRegistro).format('YYYY-MM-DD')} - ${p.nombre} (Asociado a: ${p.planEntrenamientoInfo.nombre})`,
          value: p
        })),
      });

      const { accion } = await inquirer.prompt({
          type: 'list', name: 'accion', message: '¿Qué acción deseas realizar sobre este plan?',
          choices: [
              { name: 'Editar (reemplazar por uno nuevo)', value: 'editar' },
              { name: 'Eliminar Permanentemente (irreversible)', value: 'eliminar' },
              new inquirer.Separator(),
              { name: 'Volver', value: 'volver'},
          ]
      });

      if (accion === 'editar') {
        log(info('\nEstás editando el plan. Por favor, introduce los nuevos datos.'));
        const datosPlan = await inquirer.prompt([
            { type: 'input', name: 'nombre', message: 'Nuevo nombre del plan:', default: planSeleccionado.nombre },
            { type: 'input', name: 'descripcion', message: 'Nueva descripción:', default: planSeleccionado.descripcion },
        ]);

        // --- INICIO DE LA CORRECCIÓN CLAVE ---
        // Implementamos el bucle interactivo para registrar las NUEVAS comidas.
        const comidas = [];
        const tiposDeComida = ["desayuno", "almuerzo", "cena"];
        let continuarAñadiendo = true;
        while (continuarAñadiendo && comidas.length < tiposDeComida.length) {
            const comidasYaAñadidas = comidas.map(c => c.nombre);
            const opcionesDisponibles = tiposDeComida
              .filter(tipo => !comidasYaAñadidas.includes(tipo))
              .map(tipo => ({ name: tipo.charAt(0).toUpperCase() + tipo.slice(1), value: tipo }));

            if (opcionesDisponibles.length === 0) break;
            
            opcionesDisponibles.push(new inquirer.Separator(), { name: 'Terminar y guardar', value: 'terminar' });

            const { tipoComida } = await inquirer.prompt({
                type: 'list', name: 'tipoComida',
                message: `Añadir comida para el nuevo plan (${comidas.length + 1}/${tiposDeComida.length}):`,
                choices: opcionesDisponibles
            });

            if (tipoComida === 'terminar') {
                continuarAñadiendo = false;
                continue;
            }
            
            const detallesComida = await inquirer.prompt([
                { type: 'input', name: 'descripcion', message: `Descripción para ${tipoComida}:`, validate: v => v.length > 0 || 'La descripción es requerida.' },
                { type: 'input', name: 'caloriasEstimadas', message: 'Calorías estimadas (opcional):',
                  validate: (v) => v === '' || !isNaN(parseInt(v)) && parseInt(v) >= 0 || 'Introduce un número válido.'}
            ]);
            
            const nuevaComida = { nombre: tipoComida, descripcion: detallesComida.descripcion };
            if (detallesComida.caloriasEstimadas) {
                nuevaComida.caloriasEstimadas = parseInt(detallesComida.caloriasEstimadas, 10);
            }
            comidas.push(nuevaComida);
            log(success(`› ${tipoComida.charAt(0).toUpperCase() + tipoComida.slice(1)} añadido al nuevo plan.`));
        }

        // Verificamos que el usuario haya añadido al menos una comida
        if (comidas.length === 0) {
            log(error('\nError: Un plan nutricional debe tener al menos una comida. Edición cancelada.'));
            return;
        }
        
        const planActualizado = {
            contratoId: planSeleccionado.contratoId,
            nombre: datosPlan.nombre,
            descripcion: datosPlan.descripcion,
            comidas: comidas,
            fechaRegistro: planSeleccionado.fechaRegistro
        };
        
        await this.planNutricionalRepo.update(planSeleccionado._id, planActualizado);
        log(success('\nEl plan nutricional ha sido actualizado exitosamente.'));
        // --- FIN DE LA CORRECCIÓN CLAVE ---
        
      } else if (accion === 'eliminar') {
        const { confirmar } = await inquirer.prompt({
            type: 'confirm', name: 'confirmar',
            message: warn('ADVERTENCIA: Estás a punto de eliminar este plan permanentemente. ¿Deseas continuar?'),
            default: false,
        });
        if (confirmar) {
            await this.planNutricionalRepo.deleteById(planSeleccionado._id);
            log(success('\nEl plan nutricional ha sido eliminado permanentemente.'));
        } else {
            log(info('Eliminación cancelada.'));
        }
      }

    } catch (err) {
      log(error(`Error al gestionar el plan nutricional: ${err.message}`));
    }
  }
}