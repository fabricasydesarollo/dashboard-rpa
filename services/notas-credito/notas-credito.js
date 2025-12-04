import { sequelize } from '../../db/database.js';
import { NotaCreditoMasiva } from '../../models/NotaCreditoMasiva.js'
import { Bot } from '../../models/Bot.js';
import { Maquina } from '../../models/Maquina.js';
import { extraerDatos } from './utils/extraerDatos.js';

export const NotasCreditoService = {

async updateNotaCreditoAvidanti(data) {
  try {
    if (!Array.isArray(data)) data = [data];
    
    const resultados = [];

    for (const item of data) {
      const t = await sequelize.transaction();

      try {
        let notaCredito = await NotaCreditoMasiva.findOne({
          where: { id: item.id },
          transaction: t
        });

        // Si no está pendiente → rollback y saltar al siguiente item
        if (!notaCredito || notaCredito.estado !== "pendiente") {
          await t.rollback();
          continue; // ⬅⬅⬅ No rompemos todo, solo saltamos este
        }

        let maquina = null;

        if (item.maquina_id) {
          maquina = await Maquina.findOne({
            where: { id: item.maquina_id, bot_id: item.bot_id },
            transaction: t
          });

          if (maquina) {
            await maquina.update({
              estado: item.estado_bot || maquina.estado,
              procesados: item.procesados ?? maquina.procesados,
              total_registros: item.total_registros ?? maquina.total_registros,
            }, { transaction: t });
          } else {
            maquina = await Maquina.create({
              id: item.maquina_id,
              bot_id: item.bot_id,
              estado: item.estado_bot || 'activo',
              total_registros: item.total_registros || 0,
              procesados: item.procesados || 0
            }, { transaction: t });
          }

        } else {
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

        resultados.push({ notaCredito, bot, maquina });

      } catch (err) {
        await t.rollback();
        resultados.push({ error: err.message, item });
      }
    }

    return resultados;

  } catch (error) {
    console.log("Fatal error en updateNotaCreditoAvidanti:", error);
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
        const error = new Error('No se encontraron notas credito');
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
      const notasCredito = await NotaCreditoMasiva.bulkCreate(datos);
      return notasCredito
    } catch (error) {
      console.error('Error en NotasCreditoService.cargarNotasCredito:', error);
      throw error;
    }
    
  },
  async getNotasCreditoPendientes(bot_id) {
    try {
      //cargar todas las Notas credito masivas para el bot avidanti id: 4
      const notasCredito = await NotaCreditoMasiva.findAll({
        where: { bot_id, estado: 'pendiente'},
        attributes: {
          exclude: ['estado', 'fecha_ejecucion', 'duracion', 'cufe', 'cude', 'pdf']
        },
        order: [['createdAt', 'ASC']]
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
  }


};
