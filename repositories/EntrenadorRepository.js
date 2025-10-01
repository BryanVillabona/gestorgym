import database from '../config/mongodb.js';
import { ObjectId } from 'mongodb';

export default class EntrenadorRepository {
  constructor() {
    this.database = database;
  }

  async _getCollection() {
    return await this.database.getCollection('entrenadores');
  }

  async create(entrenadorData) {
    const collection = await this._getCollection();
    return await collection.insertOne(entrenadorData);
  }

  async findAll() {
    const collection = await this._getCollection();
    return await collection.find({}).sort({ nombre: 1 }).toArray();
  }
}