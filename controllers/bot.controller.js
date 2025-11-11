import jwt from 'jsonwebtoken';
import { UserRepository } from '../services/repositories/user-repository.js';
import { BotRepository } from '../services/repositories/bot-repository.js';
import { sequelize } from '../db/database.js';
import { AutorizacionBot } from '../models/AutorizacionBot.js';
import { Paciente } from '../models/Paciente.js';
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
  },
  async getAutorizaciones(req, res) {
    try {
      const autorizaciones = await BotRepository.getAutorizaciones();
      return res.status(200).json(autorizaciones);
    } catch (err) {
      console.error(err);
      return res.status(err.status || 500).json({ error: err.error || 'Error al obtener las autorizaciones' });
    }
  },
  async createAutorizacion(req, res) {
    const data = req.body;

    const t = await sequelize.transaction();

    try {
      // Verificar si el paciente ya existe
      let paciente = await Paciente.findOne({
        where: { numero_identificacion: data.identificacion },
        transaction: t
      });

      if (!paciente) {
        paciente = await Paciente.create({
          numero_identificacion: data.identificacion,
          nombre: data.nombre, // nombre del paciente
          correo_electronico: data.correo_electronico // opcional
        }, { transaction: t });
      }

      // Crear la autorización
      let autorizacion = await AutorizacionBot.create({
        paciente_id: paciente.id,
        bot_id: data.bot_id,
        idOrden: data.idOrden || null,
        grupoAtencion: data.grupoAtencion || null,
        empresa: data.empresa,
        sede: data.sede || null,
        fechaSolicitud: data.fechaSolicitud,
        CUPS: data.CUPS,
        desRelacionada: data.desRelacionada || null,
        diagnostico: data.diagnostico || null,
        cantidad: data.cantidad || null,
        numIngreso: data.numIngreso,
        numFolio: data.numFolio,
        contratado: data.contratado || 0,
        ordenDuplicada: data.ordenDuplicada || 0,
        anulada: data.anulada || 0,
        activoEPS: data.activoEPS || 1,
        gestionadoTramita: data.gestionadoTramita || 0,
        metodoRadicacion: data.metodoRadicacion,
        nroAutorizacionRadicado: data.nroAutorizacionRadicado || null,
        fechaAutorizacion: data.fechaAutorizacion,
        fechaVencimiento: data.fechaVencimiento,
        inicio_proceso: data.inicio_proceso,
        fin_proceso: data.fin_proceso
      }, { transaction: t });

      // Recargar la autorización incluyendo el paciente
      autorizacion = await AutorizacionBot.findByPk(autorizacion.id, {
        include: [
          {
            model: Paciente,
            attributes: ['numero_identificacion', 'nombre', 'correo_electronico']
          },
          {
            model: Bot,
            attributes: ['nombre']
          }
        ],
        transaction: t
      });
      // Confirmar la transacción
      await t.commit();

      return res.status(201).json({ message: 'Autorización creada correctamente', autorizacion });
    } catch (error) {
      await t.rollback();
      console.error(error);
      return res.status(500).json({ message: 'Error al crear la autorización', error: error.message });
    }
  },
  
};

