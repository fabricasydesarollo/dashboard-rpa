import jwt from 'jsonwebtoken';
import { UserRepository } from '../services/repositories/user-repository.js';
import { BotRepository } from '../services/repositories/bot-repository.js';
import path from 'path';


export const BotController = {
  async create(req, res) {
    try {
      const botData = req.body;
      const { user_id } = req.user;
      const newBot = await BotRepository.create(botData, user_id);
      return res.status(201).json({ bot: newBot });
    } catch (err) {
      console.error('Error al crear el bot:', err);
      return res.status(err.status || 500).json({ error: err.error || 'Error al crear el bot' });
    }
  },
  async update(req, res) {
    try {
      const botData = req.body;
      const { user_id } = req.user;
      const updatedBot = await BotRepository.update(botData, user_id);
      return res.status(200).json({ bot: updatedBot });
    } catch (err) {
      console.error('Error al actualizar el bot')
      return res.status(err.status || 400).json({ error: err.error || 'Error al actualizar el bot' });
    }
  },  

  async delete(req, res) {
    try {
      const { botId } = req.query;
      const { user_id } = req.user;
      await BotRepository.delete(botId, user_id);
      return res.status(200).json({ message: 'Bot eliminado correctamente' });
    } catch (err) {
      console.error('Error al eliminar el bot:', err);
      return res.status(err.status || 400).json({ error: err.error || 'Error al Eliminar el bot' });
    }
  },
  
  async get(req, res) {
    try {
      const { user_id, rol } = req.query;

      const bots = await BotRepository.get({ user_id, rol });
      res.status(200).json(bots);
    } catch (err) {
      console.error(err);
      return res.status(err.status || 400).json({ error: err.error || 'Error al obtener bots' });
    }
  },

  async getRegistros(req, res) {
    try {
      const { bot_id } = req.query;

      const registros = await BotRepository.getRegistros({ bot_id});
      res.status(200).json(registros);
    } catch (err) {
      console.error(err);
      return res.status(err.status || 400).json({ error: err.error || 'Error al obtener los registros' });
    }
  },

  async getUsers(req, res) {
    try {

      const users = await BotRepository.getUsers();
      res.status(200).json(users);
    } catch (err) {
      console.error(err);
      return res.status(err.status || 400).json({ error: err.error || 'Error al obtener los usuarios' });
    }
  },
  async getBots(req, res) {
    try {

      const bots = await BotRepository.getBots();
      res.status(200).json(bots);
    } catch (err) {
      console.error(err);
      return res.status(err.status || 400).json({ error: err.error || 'Error al obtener los bots' });
    }
  },

  async addBotsToUser(req, res) {
    try {
      const { userId, botsId } = req.body;

      const usuario = await BotRepository.addBotsToUser(userId, botsId);

      return res.status(200).json(usuario);
    } catch (err) {
      console.error('Error en addBotsToUser:', err);
      return res.status(err.status || 500).json({ error: err.error || 'Error al actualizar bots del usuario' });
    }
  },

  async updateUserRol(req, res) {
    try {
      const user = req.body;

      if (!user.id || !user.rol) {
        return res.status(400).json({ error: 'Faltan datos obligatorios (id o rol)' });
      }

      const updatedUser = await BotRepository.updateUserRol(user);
      return res.status(200).json(updatedUser);
    } catch (err) {
      console.error('Error al actualizar rol:', err);
      return res.status(err.status || 500).json({ error: err.error || 'Error al actualizar el rol del usuario' });
    }
  },

  async descargarFormato(req, res){
    const filePath = path.resolve('public/formatos/plantilla.xlsx');
    res.download(filePath, 'plantilla.xlsx', (err) => {
      if (err) {
        console.error('Error al descargar archivo:', err);
        res.status(500).json({ error: 'No se pudo descargar el archivo' });
      }
    });
  },

  async createSolicitud(req, res) {
    try {
      const { formArray, user_id, bot_id } = req.body;

      const solicitud = await BotRepository.createSolicitud( formArray, user_id, bot_id);
      const io = req.app.get('io');
      io.emit('nueva_solicitud', solicitud, Number(user_id));  // se emite la solicitud creadaen tiempo real a los demas usuarios en este caso admin o supervisor 
      return res.status(200).json(solicitud);
    } catch (err) {
      console.error('Error en createSolicitud:', err);
      return res.status(err.status || 500).json({ error: err.error || 'Error al crear la solicitud del usuario' });
    }
  },
  async activateBotPatologia(req, res) {
    try {
      const { id, fecha } = req.body; 

      const log = await BotRepository.activateBotPatologia(id,fecha);
      return res.status(200).json(log);
    } catch (err) {
      console.error('Error en activateBotPatologia:', err);
      return res.status(err.status || 500).json({ error: err.error || 'Error al activar el bot de patología' });
    }
  },
  async getAllBotMetrics(req, res) {
    try {
      const { userId } = req.query;
      const metrics = await BotRepository.getAllBotMetrics(userId);
      return res.status(200).json(metrics);
    } catch (err) {
      console.error('Error en getBotMetrics:', err);
      return res.status(err.status || 500).json({ error: err.error || 'Error al obtener las métricas de los bots' });
    }
  },
  async getBotMetrics(req, res) {
    try {
      const { botId } = req.query;  
      const metrics = await BotRepository.getBotMetrics(Number(botId));
      return res.status(200).json(metrics);   
    } catch (err) {
      console.error('Error en getBotMetrics:', err);
      return res.status(err.status || 500).json({ error: err.error || 'Error al obtener las métricas del bot' });
    }
  },
  async getPendingSolicitudes(req, res) {
    try {
      const solicitudes = await BotRepository.getPendingSolicitudes();
      return res.status(200).json(solicitudes);
    } catch (err) {
      console.error('Error en getPendingSolicitudes:', err);
      return res.status(err.status || 500).json({ error: err.error || 'Error al obtener las solicitudes pendientes' });
    }
  }
};

