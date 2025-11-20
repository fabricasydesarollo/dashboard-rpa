import { sequelize } from '../db/database.js';
import { RegistroGeneral } from '../models/RegistroGeneral.js'
import { Bot } from '../models/Bot.js';
import { Maquina } from '../models/Maquina.js';

export const RegistroGeneralService = {
  async create(data) {
    const t = await sequelize.transaction();

    try {
      const [nuevoRegistro] = await Promise.all([
        RegistroGeneral.create({
          bot_id: data.bot_id,
          maquina_id: data.maquina_id || 1,
          mensaje: data.mensaje,
          estado: data.estado,
          duracion: data.duracion,
          fecha_ejecucion: data.fecha_ejecucion || new Date(),
        }, { transaction: t }),
      ]);
      // 2. Actualizar estado de máquina(s)
      let maquina = null;
      if (data.maquina_id) {
        // Buscar si la máquina existe
        maquina = await Maquina.findOne({
          where: { id: data.maquina_id, bot_id: data.bot_id },
          transaction: t
        });

        if (maquina) {
          // Si existe → actualizar
          await Maquina.update({
            estado: data.estado_bot || 'activo',
            total_registros: data.total_registros ?? maquina.total_registros,
            procesados: data.procesados ?? maquina.procesados
          }, { transaction: t });
          // recargar la máquina actualizada
          await maquina.reload({ transaction: t });
        } else {
          // Si NO existe → crear nueva máquina
          maquina = await Maquina.create({
            id: data.maquina_id,
            bot_id: data.bot_id,
            estado: data.estado_bot || 'activo',
            total_registros: data.total_registros || 0,
            procesados: data.procesados || 0
          }, { transaction: t });
        }

      } else {
        // Si NO viene maquina_id → actualizar SOLO máquina 1 del bot
        await Maquina.update({
          estado: data.estado_bot || 'activo',
          total_registros: data.total_registros || 0,
          procesados: data.procesados || 0
        }, {
          where: { id: 1, bot_id: data.bot_id },
          transaction: t
        });

        maquina = await Maquina.findOne({
          where: { id: 1, bot_id: data.bot_id },
          transaction: t
        });
      }

      const bot = await Bot.findByPk(data.bot_id, { 
        include: { model: Maquina },     
        transaction: t 
      });
      await t.commit(); //  commit antes de seguir

      return { nuevoRegistro, bot, maquina };
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
