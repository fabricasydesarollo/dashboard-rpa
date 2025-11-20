import { sequelize } from '../db/database.js';
import { AutorizacionBot } from '../models/AutorizacionBot.js';
import { Bot } from '../models/Bot.js';
import { Paciente } from '../models/Paciente.js';
import { Maquina } from '../models/Maquina.js';

export const AutorizacionService = {
  async createAutorizacionesMasivo(data) {
    // Asegurar consistencia: si no es array, convertirlo
    //console.log('data: ',data);
    if (!Array.isArray(data)) {
      data = [data];
    }

    const resultados = [];
    const errores = [];

    for (const item of data) {
      // Iniciamos una transacción para el lote
      const t = await sequelize.transaction();
      try { 
        // 1. Buscar o crear paciente
        let paciente = await Paciente.findOne({
          where: { numero_identificacion: item.identificacion },
          transaction: t
        });

        if (!paciente) {
          paciente = await Paciente.create({
            numero_identificacion: item.identificacion,
            nombre: item.nombre,
            correo_electronico: item.correo_electronico
          }, { transaction: t });
        }

        // 2. Determinar estado de la autorizacion
        let estado_autoriza = null;

        if (item.nroAutorizacionRadicado) {
          // Normalizar: quitar espacios al inicio/final y convertir a mayúsculas para comparación segura
          const radicado = String(item.nroAutorizacionRadicado).trim().toUpperCase();

          // Verificar si comienza con "RPA-"
          if (radicado.startsWith('RPA-')) {
            estado_autoriza = 'radicado';
          } else {
            // Cualquier otro valor no vacío (números, otros prefijos, etc.) → autorizado
            estado_autoriza = 'autorizado';
          }
        } else {
          // Si es null, undefined, vacío, etc. → sin estado (o podrías usar 'pendiente' si aplica)
          estado_autoriza = null; // o 'pendiente', según tu modelo
        }

        // 3. Crear autorización
        let autorizacion = await AutorizacionBot.create({
          paciente_id: paciente.id,
          bot_id: item.bot_id,
          maquina_id: item.maquina_id || null,
          idOrden: item.idOrden || null,
          grupoAtencion: item.grupoAtencion || null,
          empresa: item.empresa,
          sede: item.sede || null,
          fechaSolicitud: item.fechaSolicitud,
          CUPS: item.CUPS,
          desRelacionada: item.desRelacionada || null,
          diagnostico: item.diagnostico || null,
          cantidad: item.cantidad || null,
          numIngreso: item.numIngreso,
          numFolio: item.numFolio,
          contratado: item.contratado || 0,
          ordenDuplicada: item.ordenDuplicada || 0,
          anulada: item.anulada || 0,
          activoEPS: item.activoEPS || 1,
          gestionadoTramita: item.gestionadoTramita || 0,
          metodoRadicacion: item.metodoRadicacion,
          nroAutorizacionRadicado: item.nroAutorizacionRadicado || null,
          fechaAutorizacion: item.fechaAutorizacion,
          fechaVencimiento: item.fechaVencimiento,
          inicio_proceso: item.inicio_proceso,
          fin_proceso: item.fin_proceso,
          estado: item.estado_proceso || 'exito',
          estado_autorizacion: estado_autoriza || null
        }, { transaction: t });

        // 4. Recargar con relaciones
        autorizacion = await AutorizacionBot.findByPk(autorizacion.id, {
          include: [
            { model: Paciente, attributes: ['numero_identificacion', 'nombre', 'correo_electronico'] },
            { model: Bot, attributes: ['nombre'] }
          ],
          transaction: t
        });
        
        if (item.maquina_id) {
          // Buscar si la máquina existe
          let maquina = await Maquina.findOne({
            where: {
              id: item.maquina_id,
              bot_id: item.bot_id
            },
            transaction: t
          });

          if (maquina) {
            // Si existe → actualizar
            await maquina.update({
              estado: item.estado_bot || 'activo',
              total_registros: item.total_registros ?? maquina.total_registros,
              procesados: item.procesados ?? maquina.procesados
            }, { transaction: t });

          } else {
            // Si NO existe → crear nueva máquina con ese ID
            await Maquina.create({
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
        }

        let bot = await Bot.findByPk(item.bot_id, { 
          include: { model: Maquina },     
          transaction: t 
        });

        // 5. Confirmar transacción
        await t.commit();
        resultados.push({ autorizacion: autorizacion, bot});

      } catch (err) {
        console.log('error: ', err);
        await t.rollback();
        errores.push({ item, error: err.message });
      }
    }
    return resultados
  } 
};
