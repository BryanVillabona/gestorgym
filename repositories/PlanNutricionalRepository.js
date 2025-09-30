import database from '../config/mongodb.js';
import { ObjectId } from 'mongodb';

export default class PlanNutricionalRepository {
  constructor() {
    this.database = database;
  }

  async _getCollection() {
    return await this.database.getCollection('planes_nutricionales');
  }

  async create(planData, options = {}) {
    const collection = await this._getCollection();
    return await collection.insertOne(planData, options);
  }

  async findByClientIdConInfo(clienteId) {
    const collection = await this._getCollection();
    const pipeline = [
      { $lookup: { from: 'contratos', localField: 'contratoId', foreignField: '_id', as: 'contratoInfo' } },
      { $unwind: '$contratoInfo' },
      { $match: { 'contratoInfo.clienteId': new ObjectId(clienteId) } },
      { $lookup: { from: 'planes_entrenamiento', localField: 'contratoInfo.planId', foreignField: '_id', as: 'planEntrenamientoInfo' } },
      { $unwind: '$planEntrenamientoInfo' },
      { $sort: { fechaRegistro: -1 } } // Ordenamos por el más reciente primero para la gestión
    ];
    return await collection.aggregate(pipeline).toArray();
  }

  async addComida(contratoId, comidaData) {
    const collection = await this._getCollection();
    const filter = { contratoId: new ObjectId(contratoId) };
    const updateDoc = { $push: { comidas: comidaData } };
    return await collection.updateOne(filter, updateDoc);
  }

  async update(id, nuevoPlanData) {
    const collection = await this._getCollection();
    const filter = { _id: new ObjectId(id) };
    // Usamos $set para reemplazar todos los campos excepto el _id
    const updateDoc = { $set: nuevoPlanData };
    return await collection.updateOne(filter, updateDoc);
  }

  async deleteById(id) {
    const collection = await this._getCollection();
    const filter = { _id: new ObjectId(id) };
    return await collection.deleteOne(filter);
  }
}