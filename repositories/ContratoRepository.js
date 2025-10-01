import database from '../config/mongodb.js';
import { ObjectId } from 'mongodb';
import dayjs from 'dayjs';

export default class ContratoRepository {
  constructor() {
    this.database = database;
  }

  async _getCollection() {
    return await this.database.getCollection('contratos');
  }

  async create(contratoData, options = {}) {
    const collection = await this._getCollection();
    return await collection.insertOne(contratoData, options);
  }

  async findActivosConInfo() {
    const collection = await this._getCollection();
    return await collection.aggregate([
      { $match: { estado: 'activo' } },
      { $lookup: { from: 'clientes', localField: 'clienteId', foreignField: '_id', as: 'clienteInfo' } },
      { $lookup: { from: 'planes_entrenamiento', localField: 'planId', foreignField: '_id', as: 'planInfo' } },
      { $unwind: '$clienteInfo' },
      { $unwind: '$planInfo' }
    ]).toArray();
  }
  
  async findAllConInfo() {
    const collection = await this._getCollection();
    return await collection.aggregate([
      { $lookup: { from: 'clientes', localField: 'clienteId', foreignField: '_id', as: 'clienteInfo' } },
      { $lookup: { from: 'planes_entrenamiento', localField: 'planId', foreignField: '_id', as: 'planInfo' } },
      {
        $lookup: {
          from: 'entrenadores',
          localField: 'entrenadorId',
          foreignField: '_id',
          as: 'entrenadorInfo'
        }
      },
      { $unwind: '$clienteInfo' },
      { $unwind: '$planInfo' },
      { $unwind: { path: "$entrenadorInfo", preserveNullAndEmptyArrays: true } },
      { $sort: { fechaInicio: -1 } }
    ]).toArray();
  }

  async findByClientIdConInfo(clienteId) {
    const collection = await this._getCollection();
    return await collection.aggregate([
      { $match: { clienteId: new ObjectId(clienteId) } },
      { $lookup: { from: 'planes_entrenamiento', localField: 'planId', foreignField: '_id', as: 'planInfo' } },
      { $unwind: '$planInfo' },
      { $sort: { fechaInicio: -1 } }
    ]).toArray();
  }

  async updateStatus(id, nuevoEstado, options = {}) {
    const collection = await this._getCollection();
    const filter = { _id: new ObjectId(id) };
    const updateDoc = { $set: { estado: nuevoEstado } };
    return await collection.updateOne(filter, updateDoc, options);
  }

  async findVencidosActivos() {
    const collection = await this._getCollection();
    const ahora = new Date();
    return await collection.aggregate([
      { $match: { estado: 'activo', fechaFin: { $lt: ahora } } },
      { $lookup: { from: 'clientes', localField: 'clienteId', foreignField: '_id', as: 'clienteInfo' } },
      { $lookup: { from: 'planes_entrenamiento', localField: 'planId', foreignField: '_id', as: 'planInfo' } },
      { $unwind: '$clienteInfo' },
      { $unwind: '$planInfo' }
    ]).toArray();
  }

  async updateManyStatus(ids, nuevoEstado) {
    const collection = await this._getCollection();
    const filter = { _id: { $in: ids } };
    const updateDoc = { $set: { estado: nuevoEstado } };
    return await collection.updateMany(filter, updateDoc);
  }

  async findRenovablesConInfo() {
    const collection = await this._getCollection();
    return await collection.aggregate([
      { $match: { estado: { $in: ['activo', 'finalizado'] } } },
      { $lookup: { from: 'clientes', localField: 'clienteId', foreignField: '_id', as: 'clienteInfo' } },
      { $lookup: { from: 'planes_entrenamiento', localField: 'planId', foreignField: '_id', as: 'planInfo' } },
      { $unwind: '$clienteInfo' },
      { $unwind: '$planInfo' },
      { $sort: { fechaFin: -1 } }
    ]).toArray();
  }

  async findAllActivosConNutricionInfo() {
    const collection = await this._getCollection();
    return await collection.aggregate([
      { $match: { estado: 'activo' } },
      { $lookup: { from: 'planes_nutricionales', localField: '_id', foreignField: 'contratoId', as: 'planesNutricionales' } },
      { $lookup: { from: 'clientes', localField: 'clienteId', foreignField: '_id', as: 'clienteInfo' } },
      { $lookup: { from: 'planes_entrenamiento', localField: 'planId', foreignField: '_id', as: 'planInfo' } },
      { $unwind: '$clienteInfo' },
      { $unwind: '$planInfo' }
    ]).toArray();
  }

  async findContratosElegiblesParaNutricion() {
    const collection = await this._getCollection();
    const inicioDeHoy = dayjs().startOf('day').toDate();
    return await collection.aggregate([
      { $match: { estado: 'activo' } },
      { $lookup: { from: 'planes_nutricionales', localField: '_id', foreignField: 'contratoId', as: 'planesNutricionales' } },
      { $addFields: { ultimaFechaNutricion: { $max: '$planesNutricionales.fechaRegistro' } } },
      { $match: { $or: [ { ultimaFechaNutricion: { $exists: false } }, { ultimaFechaNutricion: { $lt: inicioDeHoy } } ] } },
      { $lookup: { from: 'clientes', localField: 'clienteId', foreignField: '_id', as: 'clienteInfo' } },
      { $lookup: { from: 'planes_entrenamiento', localField: 'planId', foreignField: '_id', as: 'planInfo' } },
      { $unwind: '$clienteInfo' },
      { $unwind: '$planInfo' }
    ]).toArray();
  }

  async cancelActiveContractsByClientId(clienteId, options = {}) {
    const collection = await this._getCollection();
    const filter = { 
      clienteId: new ObjectId(clienteId),
      estado: 'activo' 
    };
    const updateDoc = {
      $set: { estado: 'cancelado' }
    };
    return await collection.updateMany(filter, updateDoc, options);
  }

  async findActivosConPlanNutricional() {
    const collection = await this._getCollection();
    return await collection.aggregate([
      { $match: { estado: 'activo' } },
      { $lookup: { from: 'planes_nutricionales', localField: '_id', foreignField: 'contratoId', as: 'planNutricionalInfo' } },
      { $match: { planNutricionalInfo: { $ne: [] } } },
      { $lookup: { from: 'clientes', localField: 'clienteId', foreignField: '_id', as: 'clienteInfo' } },
      { $lookup: { from: 'planes_entrenamiento', localField: 'planId', foreignField: '_id', as: 'planInfo' } },
      { $unwind: '$clienteInfo' },
      { $unwind: '$planInfo' }
    ]).toArray();
  }

  async findActivosConSeguimiento() {
    const collection = await this._getCollection();
    return await collection.aggregate([
      { $match: { estado: 'activo' } },
      { $lookup: { from: 'seguimiento_fisico', localField: '_id', foreignField: 'contratoId', as: 'seguimientoInfo' } },
      { $match: { seguimientoInfo: { $ne: [] } } },
      { $lookup: { from: 'clientes', localField: 'clienteId', foreignField: '_id', as: 'clienteInfo' } },
      { $lookup: { from: 'planes_entrenamiento', localField: 'planId', foreignField: '_id', as: 'planInfo' } },
      { $unwind: '$clienteInfo' },
      { $unwind: '$planInfo' }
    ]).toArray();
  }
}