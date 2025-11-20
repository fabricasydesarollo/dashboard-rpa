import jwt from 'jsonwebtoken';
import { RegistroGeneral } from '../models/RegistroGeneral.js';
import { RegistroGeneralService } from '../services/registro-general.js';
import { Bot } from '../models/Bot.js';
import { User } from '../models/User.js';
import { sequelize } from '../db/database.js';
//import { UserRepository } from '../services/repositories/user-repository.js';

export const RegistroGeneralController = {
  async create(req, res) {
    try {
      const { nuevoRegistro, bot, maquina } = await RegistroGeneralService.create(req.body);
      return { nuevoRegistro, bot, maquina };
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: error.message || 'Error al crear el registro' });
    }
    
  },

  async get(req, res) {
    try {
      const registros = await RegistroGeneralService.getAll();
      res.json({ ok: true, registros });
    } catch (error) {
      console.error('Error al obtener registros:', error);
      res.status(500).json({ ok: false, error: 'Error al obtener registros' });
    }
  }
};

