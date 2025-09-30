import database from '../config/mongodb.js';
import { ObjectId } from 'mongodb';

export default class SeguimientoRepository {
  constructor() {
    this.database = database;
  }

  async _getCollection() {
    return await this.database.getCollection('seguimiento_fisico');
  }

  async create(seguimientoData) {
    const collection = await this._getCollection();
    return await collection.insertOne(seguimientoData);
  }

  async findByContratoId(contratoId) {
    const collection = await this._getCollection();
    const filter = { contratoId: new ObjectId(contratoId) };
  
    return await collection.find(filter).sort({ fecha: 1 }).toArray();
  }

  async updateStatus(id, nuevoEstado) {
    const collection = await this._getCollection();
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: { estado: nuevoEstado }
    };
    return await collection.updateOne(filter, updateDoc);
  }

  async deleteById(id) {
    const collection = await this._getCollection();
    const filter = { _id: new ObjectId(id) };
    return await collection.deleteOne(filter);
  }
}