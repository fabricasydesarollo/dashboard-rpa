import { sequelize } from '../db/database.js';
import { RegistroGeneral } from '../models/RegistroGeneral.js'
import { Bot } from '../models/Bot.js';
import { Log } from '../models/Log.js';

export const LogBotService = {
  async create(data) {
    const t = await sequelize.transaction();
    try {
      // Crear el log general
      const log = await Log.create({
        bot_id: data.bot_id,
        maquina_id: data.maquina_id || null,
        mensaje: data.mensaje,
        estado: data.estado || 'pendiente',
        fecha_log: data.fecha_log || new Date(),
        duracion: data.duracion || '00:00:00' ,
      }, { transaction: t });

      // Actualizar estado del bot
      await Bot.update({
        estado: data.estado_bot || 'ejecucion',
      }, {
        where: { id: data.bot_id },
        transaction: t
      });

      await t.commit();
      const bot = await Bot.findByPk(data.bot_id);
      return { log, bot };

    } catch (error) {
      await t.rollback();
      console.error('Error al crear log general:', error);
      throw error;
    }
  },

  async getAll( { bot_id }) {
    try {
       const logs = await Log.findAll({
        where: { bot_id },
        include: [{ model: Bot, attributes: ['nombre'] }],
        order: [['fecha_log', 'DESC']],
        attributes: {
          include: [[sequelize.col('Bot.nombre'), 'nombreBot']] // Incluye el nombre del bot que se trajo del modelo Bot
        },
        include: [
          {
            model: Bot,
            attributes: [] // no lo incluimos como objeto, solo para el join
          }
        ]
      });
      return logs;
    } catch (error) {
      console.error('Error en Log-botService.getAll:', error);
      throw { status: 500, error: 'Error al  obtener los logs'};
    }
  },
  async getFechas(estado) {
    try {
      const fechas = await Log.findAll({
        where: { estado },
        attributes: [
          'id',
          'fecha_log'
        ],
        order: [['fecha_log', 'DESC']]
      });

      // Formatear la fecha y devolver también el ID
      return fechas.map(f => ({
        id: f.id,
        fecha: f.fecha_log.toISOString().split('T')[0]
      }));
    } catch (error) {
      console.error('Error en Log-botService.getFechas:', error);
      throw { status: 500, error: 'Error al obtener las fechas de los logs' };
    }
  }


};
