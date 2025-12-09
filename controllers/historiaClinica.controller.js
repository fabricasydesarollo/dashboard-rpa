// controllers/HistoriaClinicaController.js
import { sequelize } from '../db/database.js';
import { HistoriaClinica } from '../models/HistoriaClinica.js';
import { Paciente } from '../models/Paciente.js';
import { TrazabilidadEnvio } from '../models/TrazabilidadEnvio.js';
import { Bot } from '../models/Bot.js';
import { BotRepository } from '../services/repositories/bot-repository.js';

export const HistoriaClinicaController = {
  async get(req, res) {
    try {
      const { user_id } = req.user;

      const historias_clinicas = await BotRepository.getHistoriasClinicas(user_id);
      res.status(200).json(historias_clinicas);
    } catch (err) {
      console.error(err);
      res.status(err.status || 400).json({ error: err.message || 'Error al obtener las historias_clínicas' });
    }
  },
  async getPaginated(req, res) {
    try {
      const { search = '', fechaInicio, fechaFin, tipoDato = 'fecha_envio' } = req.query;
      const { user_id } = req.user;

      const result = await BotRepository.getHistoriasClinicasPaginated({ user_id, search, fechaInicio, fechaFin, tipoDato });
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(err.status || 400).json({ error: err.message });
    }
  },

  // se va a obtener todas las historias clinicas que en trazabilidad envios tengan estado pendiente
  async getHistoriasClinicasPendientes(req, res){
    try {
      const { maquinaId } = req.query;
      const historias_clinicas = await BotRepository.getHistoriasClinicasPendientes(Number(maquinaId));
      res.status(200).json(historias_clinicas);
    } catch (err) {
      console.error(err);
      res.status(err.status || 400).json({ error: err.message || 'Error al obtener las historias_clínicas' });
    }
  },
  async reprocesarHistoriaClinica(req, res) {
    try {
      const { id } = req.params; // se usa para rutas tipo: /reprocesar/historia-clinica/:id y en el axios del front va asi: `reprocesar/historia-clinica/${id}`
      //console.log('id recibida: ',id);
      await BotRepository.reprocesarHistoriaClinica(Number(id));
      res.status(200).json({ message: 'Trazabilidad reprocesada correctamente' });
    }
    catch (err) {
      console.error(err);
      return res.status(err.status || 400).json({ error: err.error || 'Error al reprocesar la trazabilidad' });
    }
  }
};
