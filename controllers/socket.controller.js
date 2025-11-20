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

//import { UserRepository } from '../services/repositories/user-repository.js';

export const SocketController = {

  async createAutorizacion(req, res) {
    try {
      const resultados =  await AutorizacionService.createAutorizacionesMasivo(req.body);
      console.log('autorizaciones: ', resultados);
      //Emitir socket para cada AUTORIZACION creada
      const io = req.app.get('io');
      for (const { autorizacion, bot } of resultados) {
        //console.log(' autorizacion; ', autorizacion, 'bot: ', bot);
        io.emit('nueva_autorizacion', autorizacion, bot);
        NotificationHelper.emitirNotificaciones(io, [
          { modulo: bot, tipo: 'bot' }
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
      const { nuevoRegistro, bot } = await RegistroGeneralController.create(req, res);

      // Emitir a todos los clientes conectados
      const io = req.app.get('io');
      io.emit('nuevo_registro', nuevoRegistro, bot, null);
      // enviar las notificaciones correspondientes segun el estado de cada modulo
      NotificationHelper.emitirNotificaciones(io, [
        { modulo: nuevoRegistro, tipo: 'registro' },
        { modulo: bot, tipo: 'bot' }
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
          maquina_id: registro.maquina_id || null,
          mensaje: registro.mensaje,
          estado: registro.estado,
          fecha_ejecucion: registro.fecha_ejecucion || new Date(),
          duracion: registro.duracion
        }, { transaction: t }),
      ]);

      // 2. Actualizar estado de máquinas
      if (registro.maquina_id) {
        // Buscar si la máquina existe
        let maquina = await Maquina.findOne({
          where: {
            id: registro.maquina_id,
            bot_id: registro.bot_id
          },
          transaction: t
        });

        if (maquina) {
          // Si existe → actualizar
          await maquina.update({
            estado: registro.estado_bot || 'activo',
            total_registros: registro.total_registros ?? maquina.total_registros,
            procesados: registro.procesados ?? maquina.procesados
          }, { transaction: t });

        } else {
          // Si NO existe → crear nueva máquina
          await Maquina.create({
            id: registro.maquina_id,    // respetar ID recibido
            bot_id: registro.bot_id,
            estado: registro.estado_bot || 'activo',
            total_registros: registro.total_registros || 0,
            procesados: registro.procesados || 0
          }, { transaction: t });
        }

      } else {

        // Actualizar TODAS las máquinas del bot
        await Maquina.update({
          estado: registro.estado_bot || 'activo',
          procesados: registro.procesados || 0,
          total_registros: registro.total_registros || 0
        }, {
          where: { id:1, bot_id: registro.bot_id },
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
        { modulo: bot, tipo: 'bot' },
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
          if (trazabilidad.estado_envio === 'pendiente'){
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
        // Ahora actualizar las máquinas de ese bot
        if (data.maquina_id) {
            // Actualizar solo una
            await Maquina.update({
                estado: data.estado_bot || 'activo',
                procesados: data.procesados || 0 ,
                total_registros: data.total_registros || 0
            }, {
                where: {
                    id: data.maquina_id,
                    bot_id: data.bot_id
                },
                transaction: t
            });

        } else {
            // Actualizar todas las máquinas del bot
            await Maquina.update({
                estado: data.estado_bot || 'activo',
                procesados: data.procesados || 0 ,
                total_registros: data.total_registros || 0
            }, {
                where: { bot_id: data.bot_id },
                transaction: t
            });
        }
        let bot = await Bot.findByPk(data.bot_id, { 
          include: { model: Maquina },     // <-- aquí cargas las máquinas
          transaction: t 
        });

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

        resultados.push({ historia: trazabilidadCompleta, bot });
      }

      // 6. Confirmar transacción
      await t.commit();

      // 7. Emitir socket para cada historia creada
      const io = req.app.get('io');
      if (!omitir){
        for (const { historia, bot } of resultados) {
          io.emit('nueva_historia', historia, bot);
          NotificationHelper.emitirNotificaciones(io, [
            { modulo: historia, tipo: 'historia_clinica' },
            { modulo: bot, tipo: 'bot' }
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