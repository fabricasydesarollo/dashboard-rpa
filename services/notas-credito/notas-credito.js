import { sequelize } from '../../db/database.js';
import { NotaCreditoMasiva } from '../../models/NotaCreditoMasiva.js'
import { Bot } from '../../models/Bot.js';
import { Maquina } from '../../models/Maquina.js';
import { extraerDatos } from './utils/extraerDatos.js';

export const NotasCreditoService = {
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
        order: [['createdAt', 'DESC']]
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
