// Esta clase actúa como una "interfaz" en JavaScript.
// Define el contrato que todos los comandos concretos deben seguir.
export default class Command {
  /**
   * Método que debe ser implementado por todas las clases de comando.
   * Ejecuta la lógica principal del comando.
   */
  async execute() {
    throw new Error("El método 'execute()' debe ser implementado por la clase hija.");
  }
}