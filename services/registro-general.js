import { sequelize } from '../db/database.js';
import { RegistroGeneral } from '../models/RegistroGeneral.js'
import { Bot } from '../models/Bot.js';

export const RegistroGeneralService = {
  async create(data) {
    const t = await sequelize.transaction();

    try {
      const [nuevoRegistro] = await Promise.all([
        RegistroGeneral.create({
          bot_id: data.bot_id,
          mensaje: data.mensaje,
          estado: data.estado,
          duracion: data.duracion,
          fecha_ejecucion: data.fecha_ejecucion || new Date(),
        }, { transaction: t }),

        Bot.update({
          total_registros: data.total_registros,
          procesados: data.procesados,
          estado: data.estado_bot || 'ejecucion'
        }, {
          where: { id: data.bot_id },
          transaction: t
        })
      ]);

      await t.commit(); // ✅ commit antes de seguir

      const bot = await Bot.findByPk(data.bot_id);

      return { nuevoRegistro, bot };
    } catch (error) {
      await t.rollback(); // rollback sólo si algo falla antes del commit
      console.error('Error en RegistroGeneralService.create:', error);
      throw error;
    }
  },

  async getAll() {
    try {
      return await RegistroGeneral.findAll({
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      console.error('Error en RegistroGeneralService.getAll:', error);
      throw error;
    }
   
  }

};
