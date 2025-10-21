import { User } from '../../models/User.js' // Asegúrate de que la ruta esté correcta
import { Bot } from '../../models/Bot.js'
import { Registro } from '../../models/Registro.js';
import { UsuarioBot } from '../../models/UsuarioBot.js';
import { sequelize } from '../../db/database.js';
import { SolicitudUsuario } from '../../models/SolicitudUsuario.js';
import {  HistoriaClinica } from '../../models/HistoriaClinica.js';
import { Paciente } from '../../models/Paciente.js';
import { TrazabilidadEnvio } from '../../models/TrazabilidadEnvio.js';
import { RegistroGeneral } from '../../models/RegistroGeneral.js';
import {Log } from '../../models/Log.js';
import axios from 'axios';

export class BotRepository {
  static async get({ user_id, rol }) {
    const user = await User.findByPk(user_id, {
      include: {
        model: Bot,
        through: { attributes: [] } // No incluir datos de la tabla intermedia
      }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user.Bots; // Array de bots relacionados al usuario
  }
  static async getAllBotMetrics(userId) {
    try {
      // 1️⃣ Buscar usuario con sus bots
      const user = await User.findByPk(userId, {
        include: {
          model: Bot,
          through: { attributes: [] }
        }});

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // 2️ Definir qué modelos usar
      const registrosNormalesIds = [1, 2, 3];
      const botHistoriasClinicasId = 7;

      const metricas = [];

      // 3️ Iterar sobre los bots y consultar métricas con COUNT
      for (const bot of user.Bots) {
        let resultados = [];

        if (registrosNormalesIds.includes(bot.id)) {
          resultados = await Registro.findAll({
            where: { bot_id: bot.id },
            attributes: [
              'estado',
              [sequelize.fn('COUNT', sequelize.col('estado')), 'total']
            ],
            group: ['estado']
          });

        } else if (bot.id === botHistoriasClinicasId) {
          resultados = await TrazabilidadEnvio.findAll({
            where: { bot_id: bot.id },
            attributes: [
              ['estado_envio', 'estado'],
              [sequelize.fn('COUNT', sequelize.col('estado_envio')), 'total']
            ],
            group: ['estado_envio']
          });

        } else {
          resultados = await RegistroGeneral.findAll({
            where: { bot_id: bot.id },
            attributes: [
              'estado',
              [sequelize.fn('COUNT', sequelize.col('estado')), 'total']
            ],
            group: ['estado']
          });
        }

        // 4️ Convertimos el resultado a un formato simple
        const counts = {
          exito: 0,
          error: 0,
          pendiente: 0,
          proceso: 0
        };

        resultados.forEach(r => {
          const estado = r.dataValues.estado;
          const total = parseInt(r.dataValues.total, 10);
          if (counts[estado] !== undefined) {
            counts[estado] = total;
          }
        });

        const total_registros = Object.values(counts).reduce((a, b) => a + b, 0);
        const procesados = counts.exito + counts.error;

        metricas.push({
          bot_id: bot.id,
          exito: counts.exito,
          error: counts.error,
          pendiente: counts.pendiente,
          proceso: counts.proceso,
          procesados,
          total_registros
        });
      }

      return metricas;

    } catch (error) {
      console.error('❌ Error obteniendo métricas:', error);
      throw new Error('Error al obtener las métricas de los bots');
    }
  }
  static async getBotMetrics(botId) {
    try {
      const registrosNormalesIds = [1, 2, 3];
      const botHistoriasClinicasId = 7;

      let Model;
      let estadoCampo = 'estado';

      if (registrosNormalesIds.includes(botId)) {
        Model = Registro;
      } else if (botId === botHistoriasClinicasId) {
        Model = TrazabilidadEnvio;
        estadoCampo = 'estado_envio';
      } else {
        Model = RegistroGeneral;
      }

      // Agrupar por estado y contar
      const resultados = await Model.findAll({
        where: { bot_id: botId },
        attributes: [
          [estadoCampo, 'estado'],
          [sequelize.fn('COUNT', sequelize.col(estadoCampo)), 'cantidad']
        ],
        group: [estadoCampo],
        raw: true
      });

      // Inicializamos contadores
      const metricas = { exito: 0, error: 0, pendiente: 0, proceso: 0 };

      // Llenamos los contadores según los resultados
      for (const r of resultados) {
        if (r.estado && metricas.hasOwnProperty(r.estado)) {
          metricas[r.estado] = parseInt(r.cantidad, 10);
        }
      }

      const total_registros = resultados.reduce((acc, r) => acc + parseInt(r.cantidad, 10), 0);
      const procesados = metricas.exito + metricas.error;

      return {
        bot_id: botId,
        ...metricas,
        procesados,
        total_registros
      };

    } catch (error) {
      console.error('❌ Error obteniendo métricas del bot:', error);
      throw new Error('Error al obtener las métricas del bot');
    }
  }


  static async getRegistros({ bot_id }) {
    let registros = [];

    if ( Number(bot_id) === 1 ) {
        registros = await Registro.findAll({
        where: { bot_id },
        order: [['fecha_ejecucion', 'DESC']], // Ordenar por fecha de ejecución MAS ACTUAL
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
    }else {
      registros = await RegistroGeneral.findAll({
        where: { bot_id },
        order: [['fecha_ejecucion', 'DESC']], // Ordenar por fecha de ejecución MAS ACTUAL
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
    }
    //console.log(' registros bot: ',bot_id, ': ',registros);
   
    return registros;
  }
  static async getUsers() {
    try {
      console.log('Buscando usuarios...');
      const usuarios = await User.findAll({
        attributes: { exclude: ['password'] }, // 👈 excluye la contraseña
        include: {
          model: Bot,
          through: { attributes: [] } // No incluir datos de la tabla intermedia
        },
        order: [['createdAt', 'ASC']]
      });

      return usuarios;
    } catch (error) {
      console.error('Error en BotRepository.getUsers:', error);
      throw { status: 500, error: 'Error al consultar usuarios en la base de datos' };
    }
  }

   static async getBots() {
    try {
      console.log('Buscando bots...');
      const bots = await Bot.findAll({
        attributes: { exclude: ['total_registros','procesados'] }, // 👈 excluye la contraseña
        order: [['id','ASC']]
      });
      return bots;
    } catch (error) {
      console.error('Error en BotRepository.getBots:', error);
      throw { status: 500, error: 'Error al consultar bots en la base de datos' };
    }
  }

  static async addBotsToUser(userId, botsId) {
    return await sequelize.transaction(async (transaction) => {
      const nuevosBots = botsId.map(id => Number(id));

      const existentes = await UsuarioBot.findAll({
        where: { user_id: userId },
        attributes: ['bot_id'],
        transaction
      });
      const botsExistentes = existentes.map(e => e.bot_id);

      const aInsertar = nuevosBots.filter(botId => !botsExistentes.includes(botId));
      const aEliminar = botsExistentes.filter(botId => !nuevosBots.includes(botId));

      if (aEliminar.length > 0) {
        await UsuarioBot.destroy({
          where: { user_id: userId, bot_id: aEliminar },
          transaction
        });
      }

      if (aInsertar.length > 0) {
        const registros = aInsertar.map(botId => ({ user_id: userId, bot_id: botId }));
        await UsuarioBot.bulkCreate(registros, { transaction });
      }

      // 🔹 Obtener el usuario actualizado
      return await User.findByPk(userId, {
        attributes: { exclude: ['password'] }, // 👈 excluye la contraseña
        include: [{ model: Bot, as: 'Bots' }],
        transaction
      });
    });
  }


  static async updateUserRol(userData) {
    const { id, rol} = userData;

    // Actualizar usando sequelize
    const user = await User.findByPk(id, {
      //attributes: { exclude: ['password'] }, // 👈 excluye la contraseña
      include: [{ model: Bot, as: 'Bots' }]
    });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    user.rol = rol;
    user.updatedAt = new Date().toISOString(); // Asegurar formato ISO

    await user.save();

    // Excluir password antes de devolver
    const { password, ...safeUser } = user.get({ plain: true });
    return safeUser;
  }

  static async createSolicitud(formArray, user_id, bot_id) {
    return await sequelize.transaction(async (transaction) => {
      const solicitudes = [];
      const solicitudesToBot = [];

      for (const form of formArray) {
        const solicitud = await SolicitudUsuario.create({
          user_id,
          bot_id,
          nombre: form.nombre,
          identificacion: form.identificacion,
          fecha_inactivacion: form.fecha_inactivacion,
          cargo: form.cargo,
          cuenta_delegar: form.cuenta_delegar || "",
          buzon_compartido: form.buzon_compartido,
          sucursal: form.sucursal || null
        }, { transaction });
        // 
        // 🔹 Traer solicitud con relaciones
        const solicitudConRelaciones = await SolicitudUsuario.findByPk(solicitud.id, {
          include: [
            { model: User, attributes: ['nombre'] },
            { model: Bot, attributes: ['nombre'] },
            { model: Registro, as: 'Registro', attributes: ['mensaje'] },
          ],
          transaction
        });

        solicitudes.push(solicitudConRelaciones);
      }
      return solicitudes;
    });
  }
  static async getPendingSolicitudes() {
    const solicitudes = await SolicitudUsuario.findAll({
      where: { estado: 'pendiente' },
      order: [['createdAt', 'ASC']]
    });
    //console.log('solicitudes: ',solicitudes);
    
    //VALIDAR SI HAY SOLICITUDES
    if (!solicitudes.length) {
      const error = new Error('No se encontraron solicitudes pendientes');
      error.status = 404;
      throw error;
    }
    return solicitudes;
  }

  static async getHistoriasClinicas(user_id) {
    const user = await User.findByPk(user_id);

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.status = 404;
      throw error;
    }

    const trazabilidades = await TrazabilidadEnvio.findAll({
      include: [
        {
          model: HistoriaClinica,
          attributes: ['ingreso', 'fecha_historia', 'folio', 'empresa', 'sede'],
          include: [ { model: Paciente, attributes: ['nombre', 'numero_identificacion', 'correo_electronico'] } ]
        },
        {
          model: Bot,
          attributes: ['nombre']
        }
      ],
      order: [['fecha_envio', 'DESC']]
    });

    if (!trazabilidades.length) {
      const error = new Error('No se encontraron historias clínicas');
      error.status = 404;
      throw error;
    }

    return trazabilidades;
  }
 static async getHistoriasClinicasPendientes(maquinaId) {
    const trazabilidades = await TrazabilidadEnvio.findAll({
      include: [
        {
          model: HistoriaClinica,
          attributes: ['ingreso', 'fecha_historia', 'folio', 'empresa', 'sede'],
          include: [
            {
              model: Paciente,
              attributes: ['nombre', 'numero_identificacion', 'correo_electronico']
            }
          ]
        },
      ],
      //Ordenar por fecha_historia (ascendente)
      order: [[{ model: HistoriaClinica }, 'fecha_historia', 'ASC']],
      where: { estado_envio: 'pendiente', maquina_id: maquinaId }
    });

    if (!trazabilidades.length) {
      const error = new Error('No se encontraron historias clínicas pendientes');
      error.status = 404;
      throw error;
    }

    // 🔹 Aplanar los datos
    const historiasAplanadas = trazabilidades.map(t => {
      const h = t.HistoriaClinica;
      const p = h?.Paciente;

      return {
        empresa: h?.empresa || null,
        sede: h?.sede || null,
        maquina_id: t?.maquina_id,
        numero_identificacion: p?.numero_identificacion || null,
        nombre: p?.nombre || null,
        correo_electronico: p?.correo_electronico || null,
        ingreso: h?.ingreso || null,
        fecha_historia: h?.fecha_historia || null,
        folio: h?.folio || null
      };
    });

    return historiasAplanadas;
  }
  static async activateBotPatologia(id, fecha) {
    try {
      console.log(`Activando bot de patología para la fecha: ${fecha}, log ID: ${id}`);
      // Aquí  agregar la lógica específica para activar el bot con una API
      await Log.update(
        { estado: 'proceso' },
        { where: { id } }
      );
      const log = await Log.findByPk(id);
      // Simulación de llamada a API o proceso
      // await axios.post('http://url-del-bot/activar-patologia', { fecha });
      //una vez sea exitoso pasamos el log anterior a exito o se elimina y se deja el nuevo log

      return { log: log}
    } catch (error) {
      console.error('Error en BotRepository.activateBotPatologia:', error);
      throw new Error('Error al activar el bot de patología');
    }
  }

}