import database from '../config/mongodb.js';
import { ObjectId } from 'mongodb';

export default class ClienteRepository {
  constructor() {
    this.database = database;
  }

  async _getCollection() {
    return await this.database.getCollection('clientes');
  }

  async create(clienteData, options = {}) {
    const collection = await this._getCollection();
    return await collection.insertOne(clienteData, options);
  }

  async findAll() {
    const collection = await this._getCollection();
    return await collection.find({}).sort({ nombre: 1 }).toArray();
  }

  async findById(id) {
    const collection = await this._getCollection();
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  async update(id, clienteData) {
    const collection = await this._getCollection();
    const filter = { _id: new ObjectId(id) };
    const dataToUpdate = { ...clienteData };
    delete dataToUpdate._id;
    const updateDoc = { $set: dataToUpdate };
    return await collection.updateOne(filter, updateDoc);
  }

  async delete(id) {
    const collection = await this._getCollection();
    return await collection.deleteOne({ _id: new ObjectId(id) });
  }

  async findClientesConPlanNutricional() {
    const collection = await this._getCollection();
    return await collection.aggregate([
      // 1. Unir clientes con sus contratos
      {
        $lookup: {
          from: 'contratos',
          localField: '_id',
          foreignField: 'clienteId',
          as: 'contratos'
        }
      },
      { $unwind: '$contratos' }, // Desplegar los contratos
      // 2. Unir esos contratos con sus planes nutricionales
      {
        $lookup: {
          from: 'planes_nutricionales',
          localField: 'contratos._id',
          foreignField: 'contratoId',
          as: 'planNutricional'
        }
      },
      // 3. Filtrar para quedarse solo con los que SÍ encontraron un plan nutricional
      { $match: { planNutricional: { $ne: [] } } },
      // 4. Agrupar para obtener clientes únicos
      {
        $group: {
          _id: '$_id',
          nombre: { $first: '$nombre' }
        }
      },
      // 5. Ordenar por nombre
      { $sort: { nombre: 1 } }
    ]).toArray();
  }
}