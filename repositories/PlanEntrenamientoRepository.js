import database from '../config/mongodb.js';
import { ObjectId } from 'mongodb';

export default class PlanEntrenamientoRepository {
  constructor() {
    this.database = database;
  }

  async _getCollection() {
    return await this.database.getCollection('planes_entrenamiento');
  }

  async create(planData) {
    const collection = await this._getCollection();
    return await collection.insertOne(planData);
  }

  async findAll() {
    const collection = await this._getCollection();
    return await collection.find({}).toArray();
  }

  async findById(id) {
    const collection = await this._getCollection();
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  async update(id, planData) {
    const collection = await this._getCollection();
    const filter = { _id: new ObjectId(id) };
    const dataToUpdate = { ...planData };
    delete dataToUpdate._id;
    
    const updateDoc = {
      $set: dataToUpdate,
    };

    return await collection.updateOne(filter, updateDoc);
  }

  async delete(id) {
    const collection = await this._getCollection();
    return await collection.deleteOne({ _id: new ObjectId(id) });
  }
}

