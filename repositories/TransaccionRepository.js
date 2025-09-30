import database from '../config/mongodb.js';
import { ObjectId } from 'mongodb';

export default class TransaccionRepository {
  constructor() {
    this.database = database;
  }

  async _getCollection() {
    return await this.database.getCollection('transacciones_financieras');
  }

  async create(transaccionData, options = {}) {
    const collection = await this._getCollection();
    return await collection.insertOne(transaccionData, options);
  }

  async getBalance({ fechaInicio, fechaFin, clienteId } = {}) {
    const collection = await this._getCollection();
    
    const pipeline = [];
    const matchStage = {};

    // Construimos el objeto de filtro dinámicamente
    if (fechaInicio && fechaFin) {
      matchStage.fecha = { $gte: fechaInicio, $lte: fechaFin };
    }
    if (clienteId) {
      matchStage.clienteId = new ObjectId(clienteId);
    }

    // Si hay algún filtro, añadimos la etapa $match
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // La etapa de agrupación no cambia
    pipeline.push({
      $group: {
        _id: '$tipo',
        total: { $sum: '$monto' }
      }
    });

    const resultadoAgregacion = await collection.aggregate(pipeline).toArray();
    
    // El procesamiento del resultado no cambia
    const balance = { ingresos: 0, egresos: 0 };
    resultadoAgregacion.forEach(grupo => {
      if (grupo._id === 'ingreso') {
        balance.ingresos = grupo.total;
      } else if (grupo._id === 'egreso') {
        balance.egresos = grupo.total;
      }
    });

    return balance;
  }

  async findByClientId(clienteId) {
    const collection = await this._getCollection();
    const filter = { clienteId: new ObjectId(clienteId) };
    return await collection.find(filter).sort({ fecha: 1 }).toArray();
  }
}