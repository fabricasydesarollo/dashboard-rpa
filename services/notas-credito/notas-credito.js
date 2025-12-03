import { sequelize } from '../../db/database.js';
import { NotaCreditoMasiva } from '../../models/NotaCreditoMasiva.js'
import { Bot } from '../../models/Bot.js';
import { Maquina } from '../../models/Maquina.js';
import { extraerDatos } from './utils/extraerDatos.js';

export const NotasCreditoService = {

  async updateNotaCreditoAvidanti(data){
    try {
      //console.log('data: ',data);
      if (!Array.isArray(data)) {
        data = [data];
      }
      const t = await sequelize.transaction();
      const resultados = [];

      for (const item of data) {
        let notaCredito = await NotaCreditoMasiva.findOne({
          where: { id: item.id },
          transaction: t
        });
        let maquina = null;
        if (notaCredito) {
          if (item.maquina_id) {
            // Buscar si la máquina existe
            maquina = await Maquina.findOne({
              where: {
                id: item.maquina_id,
                bot_id: item.bot_id
              },
              transaction: t
            });

            if (maquina) {
              await maquina.update({
                estado: item.estado_bot || maquina.estado,
                procesados: item.procesados ?? maquina.procesados,
                total_registros: item.total_registros ?? maquina.total_registros,
              }, { transaction: t });
            }
            else {
              // Si NO existe → crear nueva máquina con ese ID
              maquina = await Maquina.create({
                id: item.maquina_id,        // IMPORTANTE: respetas el id que viene
                bot_id: item.bot_id,
                estado: item.estado_bot || 'activo',
                total_registros: item.total_registros || 0,
                procesados: item.procesados || 0
              }, { transaction: t });
            }

          } else {
            // Si no mandan maquina_id → actualizar todas las del bot
            await Maquina.update({
              estado: item.estado_bot || 'activo',
              total_registros: item.total_registros || 0,
              procesados: item.procesados || 0
            }, {
              where: { id: 1, bot_id: item.bot_id },
              transaction: t
            });
            maquina = await Maquina.findOne({
              where: { id: 1, bot_id: item.bot_id },
              transaction: t
            });
          }
          await notaCredito.update({
            maquina_id: item.maquina_id,
            estado: item.estado,
            duracion: item.duracion,
            cufe: item.cufe || null,
            cude: item.cude || null,
            descripcion: item.descripcion ?? notaCredito.descripcion,
            fecha_ejecucion: item.fecha_ejecucion,
            pdf: item.pdf || null,
          }, { transaction: t });

          let bot = await Bot.findByPk(item.bot_id, { 
            include: { model: Maquina },     
            transaction: t 
          });

          await t.commit();
          console.log('notacredito actualizada: ',notaCredito.toJSON());
          resultados.push({ notaCredito: notaCredito, bot, maquina });
        }
      }
      return resultados;
    } catch (error) {
       console.log('error: ', err);
       await t.rollback();
       throw error;
    }
  },

  async getNotasAvidanti(bot_id = 4) {
    try {
      //cargar todas las Notas credito masivas para el bot avidanti
      const notasCredito = await NotaCreditoMasiva.findAll({
        where: { bot_id },
        include: [
          {
            model: Bot,
            attributes: ['nombre']
          }
        ],
        order: [['fecha_ejecucion', 'DESC']]
      });
      
      if (!notasCredito.length) {
        console.log('nota credito: ',notasCredito);
        const error = new Error('No se encontraron notas credito para este bot');
        error.status = 404;
        throw error;
      }

      return notasCredito;
    } catch (error) {
      console.error('Error en NotasCreditoService.getNotasAvidanti:', error);
      throw error;
    }
  },

  async cargarNotasCredito(bot_id, archivo, sede) {
    try {
      const datos = await extraerDatos(archivo, sede, bot_id);
      // validar si datosProcesados tiene datos
      if (datos.length === 0) {
        const error = new Error('No se encontraron datos en el archivo de notas de crédito');
        error.status = 404;
        throw error;
      }
      //console.log('datosProcesados: ', datos, 'sede: ', sede);
      await NotaCreditoMasiva.bulkCreate(datos);
      
    } catch (error) {
      console.error('Error en NotasCreditoService.cargarNotasCredito:', error);
      throw error;
    }
    
  }

};
