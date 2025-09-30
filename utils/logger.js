import chalk from 'chalk';

// Esta es la única función que realmente imprime en la consola.
const log = console.log;

// Las siguientes funciones ahora DEVUELVEN el texto formateado en lugar de imprimirlo.
// Se convierten en "formateadores" de texto.

const success = (message) => {
  return chalk.green.bold(message);
};

const error = (message) => {
  return chalk.red.bold(message);
};

const info = (message) => {
  return chalk.blue.bold(message);
};

const warn = (message) => {
  return chalk.yellow.bold(message);
};

const clear = () => {
  console.clear();
};

export {
  log,
  success,
  error,
  info,
  warn,
  clear,
};