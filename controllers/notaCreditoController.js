// controllers/HistoriaClinicaController.js
import { sequelize } from '../db/database.js';
import { Bot } from '../models/Bot.js';
import { BotRepository } from '../services/repositories/bot-repository.js';
import { NotasCreditoService } from '../services/notas-credito/notas-credito.js';


export const NotaCreditoController = {
  async get(req, res) {
    try {
      const { bot_id } = req.query; // ID del bot Avidanti por defecto
      const notas_credito_masivas = await NotasCreditoService.getNotasAvidanti(bot_id);
      res.status(200).json(notas_credito_masivas);
    } catch (err) {
      console.error(err);
      res.status(err.status || 400).json({ error: err.message || 'Error al obtener las notas crédito' });
    }
  },
  async cargarNotasCredito(req, res) {
    try {
      const { bot_id } = req.query;
      const { sede } = req.body;
      const archivo = req.file;

      await NotasCreditoService.cargarNotasCredito(Number(bot_id), archivo, sede);
      return res.status(200).json({ message: 'Notas crédito cargadas correctamente'});
    } catch (err) {
      console.error('Error en cargarNotasCredito:', err);
      return res.status(err.status || 500).json({ error: err.message || 'Error al cargar las notas crédito' });
    }
  },
}