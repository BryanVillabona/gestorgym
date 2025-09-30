import CrearClienteCommand from './CrearCliente.Command.js';
import ListarClientesCommand from './ListarClientes.Command.js';
import CrearPlanCommand from './CrearPlan.Command.js';
import ListarPlanesCommand from './ListarPlanes.Command.js';
import EditarPlanCommand from './EditarPlan.Command.js';
import AsociarPlanCommand from './AsociarPlan.Command.js';
import EditarClienteCommand from './EditarCliente.Command.js';
import EliminarClienteCommand from './EliminarCliente.Command.js';
import RegistrarAvanceCommand from './RegistrarAvance.Command.js';
import EliminarPlanCommand from './EliminarPlan.command.js';
import VisualizarProgresoCommand from './VisualizarProgreso.Command.js';
import ListarContratosCommand from './ListarContratos.Command.js';
import CancelarContratoCommand from './CancelarContrato.Command.js';
import FinalizarContratosCommand from './FinalizarContratos.Command.js';
import RenovarContratoCommand from './RenovarContrato.Command.js';
import RegistrarEgresoCommand from './RegistrarEgreso.Command.js';
import ConsultarBalanceCommand from './ConsultarBalance.Command.js';
import RegistrarIngresoCommand from './RegistrarIngreso.Command.js';
import GestionarAvanceCommand from './GestionarAvance.Command.js';
import CrearPlanNutricionalCommand from './CrearPlanNutricional.Command.js';
import ConsultarPlanNutricionalCommand from './ConsultarPlanNutricional.Command.js';
import GestionarPlanNutricionalCommand from './GestionarPlanNutricional.Command.js';

// Patrón Factory para centralizar la creación de comandos
export default class CommandFactory {
  static create(commandName) {
    switch (commandName) {
      case 'crearCliente':
        return new CrearClienteCommand();
      case 'listarClientes':
        return new ListarClientesCommand();
      case 'crearPlan':
        return new CrearPlanCommand();
      case 'listarPlanes':
        return new ListarPlanesCommand();
      case 'editarPlan':
        return new EditarPlanCommand();
      case 'eliminarPlan': 
        return new EliminarPlanCommand();
      case 'asociarPlan':
        return new AsociarPlanCommand();
      case 'editarCliente':
        return new EditarClienteCommand();
      case 'eliminarCliente':
        return new EliminarClienteCommand(); 
      case 'registrarAvance':
        return new RegistrarAvanceCommand();
      case 'visualizarProgreso':
        return new VisualizarProgresoCommand();
      case 'listarContratos':
        return new ListarContratosCommand();
      case 'cancelarContrato':
        return new CancelarContratoCommand();
      case 'finalizarContratos':
        return new FinalizarContratosCommand();
      case 'renovarContrato':
        return new RenovarContratoCommand();
      case 'registrarEgreso':
        return new RegistrarEgresoCommand();
      case 'consultarBalance':
        return new ConsultarBalanceCommand();
      case 'registrarIngreso':
        return new RegistrarIngresoCommand();
      case 'gestionarAvance':
        return new GestionarAvanceCommand();
      case 'crearPlanNutricional':
        return new CrearPlanNutricionalCommand();
      case 'consultarPlanNutricional':
        return new ConsultarPlanNutricionalCommand();
      case 'gestionarPlanNutricional':
        return new GestionarPlanNutricionalCommand();
      default:
        throw new Error(`Comando no encontrado: ${commandName}`);
    }
  }
}