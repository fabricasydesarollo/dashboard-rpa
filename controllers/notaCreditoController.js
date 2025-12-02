// controllers/HistoriaClinicaController.js
import { sequelize } from '../db/database.js';
import { Bot } from '../models/Bot.js';
import { BotRepository } from '../services/repositories/bot-repository.js';


export const NotaCreditoController = {
  async get(req, res) {
    try {
      const { bot_id } = req.query;
      const notas_credito_masivas = await BotRepository.getNotasCredito(bot_id);
      res.status(200).json(notas_credito_masivas);
    } catch (err) {
      console.error(err);
      res.status(err.status || 400).json({ error: err.message || 'Error al obtener las notas crédito' });
    }
  },
  async cargarNotasCredito(req, res) {
    try {
      const { bot_id } = req.query;
      const archivo = req.file;

      await BotRepository.cargarNotasCredito(bot_id, archivo);
      return res.status(200).json({ message: 'Notas crédito cargadas correctamente'});
    } catch (err) {
      console.error('Error en cargarNotasCredito:', err);
      return res.status(err.status || 500).json({ error: err.message || 'Error al cargar las notas crédito' });
    }
  },
}