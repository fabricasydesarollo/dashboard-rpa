import jwt from 'jsonwebtoken';
import { Registro } from '../models/Registro.js';
import { Bot } from '../models/Bot.js';
import { User } from '../models/User.js';
import { SolicitudUsuario} from '../models/SolicitudUsuario.js';
import { sequelize } from '../db/database.js';
import { HistoriaClinica } from '../models/HistoriaClinica.js';
import { Paciente } from '../models/Paciente.js';
import { TrazabilidadEnvio } from '../models/TrazabilidadEnvio.js';
import { NotificationService } from '../services/NotificationService.js';
import { NotificationHelper } from '../utils/notificaciones.helper.js';
import { RegistroGeneralController} from './registroGeneral.controller.js'
import { LogController } from './logController.js';
import { AutorizacionService } from '../services/autorizaciones.js'
import { Maquina } from '../models/Maquina.js';
import { now } from 'sequelize/lib/utils';
import { NotasCreditoService } from '../services/notas-credito/notas-credito.js';

//import { UserRepository } from '../services/repositories/user-repository.js';

export const SocketController = {

  async actualizarNotaCreditoAvidanti(req, res) {
    try {
      const notasCreditoActualizada = await NotasCreditoService.updateNotaCreditoAvidanti(req.body);
      //console.log('notaCreditoActualizada: ',notasCreditoActualizada);
      //Emitir socket para cada AUTORIZACION creada
      if (notasCreditoActualizada.length > 0) {
        const io = req.app.get('io');
        for (const { notaCredito, bot, maquina } of notasCreditoActualizada) {
          //console.log(' autorizacion; ', autorizacion, 'bot: ', bot);
          io.emit('nueva_nota_credito', notaCredito, bot);
          NotificationHelper.emitirNotificaciones(io, [
            { modulo: maquina, tipo: 'maquina' }
          ]);
        }
        res.json({ ok: true, notasCreditoActualizada });
      } else {
        res.status(400).json({ ok: false, error: 'Hubo un error al actualizar la nota credito' });
      }
    } catch (error) {
      console.log('Error en SocketController.actualizarNotaCreditoAvidanti'),error;
      res.json({ ok: false, error: 'Hubo un error al actualizar la nota credito' })
    }
  },

  async createAutorizacion(req, res) {
    try {
      const resultados =  await AutorizacionService.createAutorizacionesMasivo(req.body);
      console.log('autorizaciones: ', resultados);
      //Emitir socket para cada AUTORIZACION creada
      const io = req.app.get('io');
      for (const { autorizacion, bot, maquina } of resultados) {
        //console.log(' autorizacion; ', autorizacion, 'bot: ', bot);
        io.emit('nueva_autorizacion', autorizacion, bot);
        NotificationHelper.emitirNotificaciones(io, [
          { modulo: maquina, tipo: 'maquina' }
        ]);
      }
      if (resultados.length > 0) {
        res.json({ ok: true, resultados });
      } else {
        res.status(400).json({ ok: false, error: 'Hubo un error al crear la autorizacion' });
      }
    } catch (error) {
      console.error('Error en SocketController.createAutorizacion:', error);
    }
  },

  async createLogBot(req, res) {
    try {
      const { log, bot } = await LogController.create(req, res);

      // Emitir a todos los clientes conectados
      const io = req.app.get('io');
      io.emit('nuevo_log', log, bot);
      // enviar las notificaciones correspondientes segun el estado de cada modulo
      NotificationHelper.emitirNotificaciones(io, [
        { modulo: log, tipo: 'log' },
        { modulo: bot, tipo: 'bot' }
      ]);
      res.json({ ok: true, log, bot});
    } catch (error) {
      console.error('Error en SocketController.createRegistroGeneral:', error);
    }
  },

   async createRegistroGeneral(req, res) {
    try {
      const { nuevoRegistro, bot, maquina } = await RegistroGeneralController.create(req, res);

      // Emitir a todos los clientes conectados
      const io = req.app.get('io');
      io.emit('nuevo_registro', nuevoRegistro, bot, null);
      // enviar las notificaciones correspondientes segun el estado de cada modulo
      NotificationHelper.emitirNotificaciones(io, [
        { modulo: nuevoRegistro, tipo: 'registro' },
        { modulo: maquina, tipo: 'maquina' },
        //{ modulo: bot, tipo: 'bot' }
      ]);
      res.json({ ok: true, nuevoRegistro, bot});
    } catch (error) {
      console.error('Error en SocketController.createRegistroGeneral:', error);
    }
  },
  
  async createRegistroAvidanti(req, res) {
    const t = await sequelize.transaction(); // crea la transacción

    try {
      const registro = req.body;

      // 1. Crear registro y actualizar bot en paralelo
      const [nuevoRegistro] = await Promise.all([
        Registro.create({
          bot_id: registro.bot_id,
          solicitud_id: registro.solicitud_id,
          maquina_id: registro.maquina_id || 1,
          mensaje: registro.mensaje,
          estado: registro.estado.toLowerCase(),
          fecha_ejecucion: registro.fecha_ejecucion || new Date(),
          duracion: registro.duracion
        }, { transaction: t }),
      ]);
      let maquina = null;

      // 2. Actualizar estado de máquinas
      if (registro.maquina_id) {
        // Buscar si la máquina existe
        maquina = await Maquina.findOne({
          where: { id: registro.maquina_id, bot_id: registro.bot_id },
          transaction: t
        });

        if (maquina) {
          await maquina.update({
            estado: registro.estado_bot || maquina.estado,
            procesados: registro.procesados ?? maquina.procesados,
            total_registros: registro.total_registros ?? maquina.total_registros,
          }, { transaction: t });
        } else {
          // Si NO existe → crear nueva máquina
          maquina = await Maquina.create({
            id: registro.maquina_id,    // respetar ID recibido
            bot_id: registro.bot_id,
            estado: registro.estado_bot || 'activo',
            total_registros: registro.total_registros || 0,
            procesados: registro.procesados || 0
          }, { transaction: t });
        }

      } else {
        // Actualizar TODAS las máquinas del bot (solo la #1 )
        await Maquina.update({
          estado: registro.estado_bot || 'activo',
          procesados: registro.procesados || 0,
          total_registros: registro.total_registros || 0
        }, {
          where: { id: 1, bot_id: registro.bot_id },
          transaction: t
        });

        maquina = await Maquina.findOne({
          where: { id: 1, bot_id: registro.bot_id },
          transaction: t
        });
      }

      // 3. Actualizar solicitud
      await SolicitudUsuario.update(
        { estado: nuevoRegistro.estado },
        { 
          where: { id: registro.solicitud_id },
          transaction: t 
        }
      );

      // 4. Cargar bot con máquinas incluidas
      const bot = await Bot.findByPk(registro.bot_id, { 
        include: [
          { model: Maquina, } ],
        transaction: t
      });

      // 5. Cargar la solicitud completa
      const solicitud = await SolicitudUsuario.findByPk(registro.solicitud_id, {
        include: [
          { model: User, attributes: ['nombre', 'cargo'] },
          { model: Bot, attributes: ['nombre'] },
          { model: Registro, as: 'Registro', attributes: ['mensaje'] }
        ],
        transaction: t
      });

      // 6. Confirmar transacción
      await t.commit();

      // Emitir data en tiempo real
      const io = req.app.get('io');
      io.emit('nuevo_registro', nuevoRegistro, bot, solicitud);

      NotificationHelper.emitirNotificaciones(io, [
        //{ modulo: bot, tipo: 'bot' },
        {modulo: maquina, tipo: 'maquina' },
        { modulo: nuevoRegistro, tipo: 'registro' },
        { modulo: solicitud, tipo: 'solicitud_usuario' }
      ]);

      res.json({ ok: true, nuevoRegistro, bot, solicitud });

    } catch (error) {
      await t.rollback();
      console.error('Error al crear registro (rollback ejecutado):', error);
      res.status(500).json({ ok: false, error: 'Error al crear registro' });
    }
  },


  async createOrUpdateHistoriaClinica(req, res) {
    const t = await sequelize.transaction();
    try {
      console.log('data recibida: ',req.body);
      
      const payload = Array.isArray(req.body) ? req.body : [req.body]; //  Acepta array o un solo objeto
      const resultados = [];
      let omitir = false;

      for (const data of payload) {
        // 1. Buscar o crear paciente
        let paciente = await Paciente.findOne({
          where: { numero_identificacion: data.numero_identificacion },
          transaction: t
        });

        if (!paciente) {
          paciente = await Paciente.create({
            numero_identificacion: data.numero_identificacion,
            nombre: data.nombre,
            correo_electronico: data.correo_electronico,
          }, { transaction: t });
        } else {
          // SI EXISTE: Validar si el correo cambió
          if (paciente.correo_electronico !== data.correo_electronico) {
            await paciente.update({
              correo_electronico: data.correo_electronico
            }, { transaction: t });
            
            console.log(`Correo actualizado para el paciente: ${paciente.numero_identificacion}`);
          }
        }

        // 2. Buscar o crear historia clínica
        let historia = await HistoriaClinica.findOne({
          where: {
            paciente_id: paciente.id,
            ingreso: data.ingreso,
            folio: data.folio,
            empresa: data.empresa || null,
            sede: data.sede || null
          },
          transaction: t
        });

        if (historia) {
          await historia.update({
            fecha_historia: data.fecha_historia
          }, { transaction: t });
        } else {
          historia = await HistoriaClinica.create({
            paciente_id: paciente.id,
            ingreso: data.ingreso,
            fecha_historia: data.fecha_historia,
            folio: data.folio,
            empresa: data.empresa || null,
            sede: data.sede || null
          }, { transaction: t });
        }

        // 3. Buscar o crear trazabilidad
        let trazabilidad = await TrazabilidadEnvio.findOne({
          where: {
            historia_id: historia.id,
            bot_id: data.bot_id
          },
          transaction: t
        });

        if (trazabilidad) {
          if (trazabilidad.estado_envio !== 'exito'){
            await trazabilidad.update({
              estado_envio: data.estado_envio || 'pendiente',
              motivo_fallo: data.motivo_fallo || null,
              fecha_envio: data.fecha_envio || new Date(),
              duracion: data.duracion || null
            }, { transaction: t });
          }else{ omitir = true}
        } else {
          trazabilidad = await TrazabilidadEnvio.create({
            historia_id: historia.id,
            bot_id: data.bot_id,
            maquina_id: data.maquina_id || 1,
            estado_envio: data.estado_envio || 'pendiente',
            motivo_fallo: data.motivo_fallo || null,
            fecha_envio: data.fecha_envio || null,
            duracion: data.duracion || null
          }, { transaction: t });
        }
        let maquina = null;
        // Ahora actualizar las máquinas de ese bot
        if (data.maquina_id) {
          // Buscar si la máquina existe
           maquina = await Maquina.findOne({
            where: { id: data.maquina_id, bot_id: data.bot_id },
            transaction: t
          });

          if (maquina) {
            await maquina.update({
                estado: data.estado_bot || maquina.estado,
                procesados: data.procesados ?? maquina.procesados,
                total_registros: data.total_registros ?? maquina.total_registros,
            }, { transaction: t });
          } else {
            // Si NO existe → crear nueva máquina
            maquina = await Maquina.create({
              id: data.maquina_id,    // respetar ID recibido
              bot_id: data.bot_id,
              estado: data.estado_bot || 'activo',
              total_registros: data.total_registros || 0,
              procesados: data.procesados || 0
            }, { transaction: t });
          }
        } else {
          // Actualizar TODAS las máquinas del bot
          await Maquina.update({
            estado: data.estado_bot || 'activo',
            procesados: data.procesados || 0,
            total_registros: data.total_registros || 0
          }, {
            where: { id:1, bot_id: data.bot_id },
            transaction: t
          });
          maquina = await Maquina.findOne({
            where: { id: 1, bot_id: data.bot_id }, transaction: t });
        }

        let bot = await Bot.findByPk(data.bot_id, { 
          include: { model: Maquina },     // <-- aquí cargas las máquinas
          transaction: t 
        });
        //console.log('data recibida: ','maquina_id: ',data.maquina_id, 'estado_bot: ',data.estado_bot,'total_registros: ',data.total_registros,'procesados: ',data.procesados);
        
        console.log('bot actualizado: ',bot.toJSON());
        
        // 5. Consultar trazabilidad completa
        const trazabilidadCompleta = await TrazabilidadEnvio.findByPk(trazabilidad.id, {
          include: [
            { model: Bot, attributes: ['nombre'] },
            {
              model: HistoriaClinica,
              attributes: ['ingreso', 'fecha_historia', 'folio', 'empresa', 'sede'],
              include: [
                { model: Paciente, attributes: ['nombre', 'numero_identificacion', 'correo_electronico'] }
              ]
            }
          ],
          transaction: t
        });

        resultados.push({ historia: trazabilidadCompleta, bot, maquina });
      }

      // 6. Confirmar transacción
      await t.commit();

      // 7. Emitir socket para cada historia creada
      const io = req.app.get('io');
      for (const { historia, bot, maquina } of resultados) {
        // 1. Emitir SIEMPRE evento de máquina y bot
        NotificationHelper.emitirNotificaciones(io, [
          { modulo: maquina, tipo: 'maquina' },
          { modulo: bot, tipo: 'bot' }
        ]);
        // 2. Emitir SIEMPRE nueva_historia (según tu lógica actual)
        io.emit('nueva_historia', historia, bot);
        // 3. Emitir historia_clinica SOLO si no hay omitir
        if (!omitir) {
          NotificationHelper.emitirNotificaciones(io, [
            { modulo: historia, tipo: 'historia_clinica' },
          ]);
        }
      }

      res.json({ ok: true, cantidad: resultados.length, resultados });
    } catch (error) {
      await t.rollback();
      console.error('Error en createOrUpdateHistoriaClinica (rollback ejecutado):', error);
      res.status(500).json({ ok: false, error: 'Error al crear/actualizar historia clínica' });
    }
  },

};