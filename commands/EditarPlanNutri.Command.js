import inquirer from 'inquirer';
import Command from './Command.js';
import { success, log, error, info } from '../utils/logger.js';
import PlanNutriRepository from '../repositories/PlanNutriRepository.js';
import { updatePlanEntrenamiento } from '../models/PlanEntrenamiento.js';
import { ObjectId } from 'mongodb';