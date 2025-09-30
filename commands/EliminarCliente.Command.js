import inquirer from "inquirer";
import { ObjectId } from 'mongodb';
import Command from './Command.js';
import { success, log, error, info } from '../utils/logger.js';
import ClienteRepository from '../repositories/ClienteRepository.js';

export default class EliminarClienteCommand extends Command {
    constructor() {
        super();
        this.clienteRepository = new ClienteRepository();
    }

    async execute() {
        log('--- Eliminar Cliente ---');
        try {
            const clientes = await this.clienteRepository.findAll();
            if (clientes.length === 0) {
                info("No hay clientes registrados para eliminar.");
                return;
            }
            const { clienteId } = await inquirer.prompt({
                type: "list",
                name: "clienteId",
                message: "Selecciona el cliente que deseas eliminar:",
                choices:
                    clientes.map((c) => ({
                        name: `${c.nombre} (${c.email})`,
                        value: c._id,
                    })),
            });
            const { confirm } = await inquirer.prompt({
                type: "confirm",
                name: "confirm",
                message: "Para confirmar la eliminación del cliente presione 'y'",
            });
            if (confirm) {
                const result = await this.clienteRepository.delete(clienteId);
                log(success(`\nCliente eliminado exitosamente. Documentos eliminados: ${result.deletedCount}`));
            } else {
                log(info('Eliminación cancelada.'));
            }
        } catch (err) {
            log(error(`Error al eliminar el cliente: ${err.message}`));
        }
    }
}