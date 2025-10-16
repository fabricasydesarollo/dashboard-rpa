import { Log } from '../models/Log.js';
import { Bot } from '../models/Bot.js';
import { sequelize } from '../db/database.js';
import { LogBotService } from '../services/log-bot.js';


export const LogController = {
  async create(req, res) {
    try {
      const { log, bot } = await LogBotService.create(req.body);
      return { log, bot };
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: error.message || 'Error al crear el registro' });
    }
  },

  async get(req, res) {
    try {
      const { bot_id } = req.query;
      const logs = await LogBotService.getAll({ bot_id });
      return res.status(200).json(logs);
    } catch (err) {
      console.error(err);
      return res.status(err.status || 400).json({ error: err.error || 'Error al obtener los logs' });
    }
  }
};
