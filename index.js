// Importación de librerias
import inquirer from 'inquirer';
import cfonts from 'cfonts';
import dotenv from 'dotenv';

// Importación de clases y utilidades
import CommandFactory from './commands/CommandFactory.js';
import { log, error, info, success } from './utils/logger.js';
import database from './config/mongodb.js';

// Configuración de variables de entorno
dotenv.config();

// Muestra el banner de bienvenida
const showBanner = () => {
  cfonts.say('Gimnasio|Los Sayayines', {
    font: 'block',
    align: 'center',
    colors: ['yellow', 'white'],
    background: 'transparent',
    space: true,
  });
  log(info('Bienvenido a la herramienta de gestión definitiva para entrenadores.'));
  console.log('\n');
};

// Submenú de clientes
const clientMenu = async () => {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Gestión de Clientes - ¿Qué deseas hacer?',
      choices: [
        { name: '1. Inscribir nuevo cliente', value: 'crearCliente' },
        { name: '2. Listar todos los clientes', value: 'listarClientes' },
        { name: '3. Editar cliente', value: 'editarCliente' },
        { name: '4. Eliminar cliente', value: 'eliminarCliente' },
        new inquirer.Separator(),
        { name: '5. Asociar nuevo plan a cliente existente', value: 'asociarPlan' },
        new inquirer.Separator(),
        { name: 'Volver al menú principal', value: 'back' },
      ],
    },
  ]);
  return action;
};

// Submenú de planes de entrenamiento
const trainingPlanMenu = async () => {
  const { action } = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'Gestión de Planes - ¿Qué deseas hacer?',
    choices: [
      { name: '1. Crear nuevo plan', value: 'crearPlan' },
      { name: '2. Listar todos los planes', value: 'listarPlanes' },
      { name: '3. Editar plan', value: 'editarPlan' },
      { name: '4. Eliminar plan', value: 'eliminarPlan' },
      new inquirer.Separator(),
      { name: 'Volver al menú principal', value: 'back' },
    ],
  });
  return action;
};

// Submenú de planes nutricionales
const nutricionMenu = async () => {
  const { choice } = await inquirer.prompt({
    type: 'list',
    name: 'choice',
    message: 'Gestión de Nutrición - ¿Qué deseas hacer?',
    choices: [
      { name: '1. Registrar plan nutricional diario', value: 'crearPlanNutricional' },
      { name: '2. Consultar reporte nutricional por cliente', value: 'consultarPlanNutricional' },
      { name: '3. Gestionar un plan diario (editar/eliminar)', value: 'gestionarPlanNutricional' },
      new inquirer.Separator(),
      { name: 'Volver al menú principal', value: 'back' },
    ],
  });
  return choice;
};

// Submenú de seguimiento físico
const seguimientoMenu = async () => {
  const { action } = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'Seguimiento de Progreso - ¿Qué deseas hacer?',
    choices: [
      { name: '1. Registrar avance físico de un cliente', value: 'registrarAvance' },
      { name: '2. Visualizar historial de progreso de un cliente', value: 'visualizarProgreso' },
      { name: '3. Gestionar un registro de avance (cancelar/eliminar)', value: 'gestionarAvance' },
      new inquirer.Separator(),
      { name: 'Volver al menú principal', value: 'back' },
    ],
  });
  return action;
};

// Submenú de contratos
const contratoMenu = async () => {
  const { choice } = await inquirer.prompt({
    type: 'list',
    name: 'choice',
    message: 'Gestión de Contratos - ¿Qué deseas hacer?',
    choices: [
      { name: '1. Listar contratos', value: 'listarContratos' },
      { name: '2. Cancelar un contrato activo', value: 'cancelarContrato' },
      { name: '3. Finalizar contratos vencidos', value: 'finalizarContratos' },
      { name: '4. Renovar un contrato', value: 'renovarContrato' },
      new inquirer.Separator(),
      { name: 'Volver al menú principal', value: 'back' },
    ],
  });
  return choice;
};

// Submenú de gestión financiera
const financieroMenu = async () => {
  const { choice } = await inquirer.prompt({
    type: 'list',
    name: 'choice',
    message: 'Gestión Financiera - ¿Qué deseas hacer?',
    choices: [
      { name: '1. Registrar ingreso vario (venta)', value: 'registrarIngreso' },
      { name: '2. Registrar egreso (gasto)', value: 'registrarEgreso' },
      { name: '3. Consultar balance financiero', value: 'consultarBalance' },
      new inquirer.Separator(),
      { name: 'Volver al menú principal', value: 'back' },
    ],
  });
  return choice;
};

const entrenadorMenu = async () => {
  const { action } = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'Gestión de Entrenadores - ¿Qué deseas hacer?',
    choices: [
      { name: '1. Registrar nuevo entrenador', value: 'crearEntrenador' },
      { name: '2. Listar todos los entrenadores', value: 'listarEntrenadores' },
      new inquirer.Separator(),
      { name: 'Volver al menú principal', value: 'back' },
    ],
  });
  return action;
};

// Menú principal
const mainMenu = async () => {
  console.clear();
  showBanner();
  const { option } = await inquirer.prompt([
    {
      type: 'list',
      name: 'option',
      message: 'Menú Principal - Selecciona una categoría',
      choices: [
        { name: '1. Gestión de Clientes', value: 'clientes' },
        { name: '2. Gestión de Planes de Entrenamiento', value: 'planes' },
        { name: '3. Seguimiento Físico', value: 'seguimiento' },
        { name: '4. Nutrición', value: 'nutricion' },
        { name: '5. Contratos', value: 'contratos' },
        { name: '6. Finanzas', value: 'financiero' },
        { name: '7. Gestión de Entrenadores', value: 'entrenadores' },
        new inquirer.Separator(),
        { name: 'Salir', value: 'exit' },
      ],
    },
  ]);
  return option;
};

// Bucle principal de la aplicación
const run = async () => {
  await database.realizarConexion();

  while (true) {
    const choice = await mainMenu();

    if (choice === 'exit') {
      log(info('¡Gracias por usar el sistema! ¡Hasta la próxima, guerrero Z!'));
      break;
    }

    let subMenuChoice = '';
    switch (choice) {
      case 'clientes':
        subMenuChoice = await clientMenu();
        break;
      case 'planes':
        subMenuChoice = await trainingPlanMenu();
        break;
      case 'seguimiento':
        subMenuChoice = await seguimientoMenu();
        break;
      case 'nutricion':
        subMenuChoice = await nutricionMenu();
        break;
      case 'contratos':
        subMenuChoice = await contratoMenu();
        break;
      case 'financiero':
        subMenuChoice = await financieroMenu();
        break;
      case 'entrenadores':
      subMenuChoice = await entrenadorMenu();
        break;
      default:
        log(error('Opción no implementada todavía.'));
        await inquirer.prompt({ type: 'input', name: 'continue', message: 'Presiona Enter para continuar...' });
        continue;
    }

    if (subMenuChoice === 'back') {
      continue;
    }

    try {
      const command = CommandFactory.create(subMenuChoice);
      await command.execute();
    } catch (err) {
      log(error(`Error al ejecutar el comando: ${err.message}`));
    }

    await inquirer.prompt({ type: 'input', name: 'continue', message: 'Presiona Enter para volver al menú...' });
  }

  await database.desconectar();
};

// En caso de error inesperado
run().catch(err => {
  log(error('Ha ocurrido un error inesperado en la aplicación:'));
  console.error(err);
  database.desconectar();
});