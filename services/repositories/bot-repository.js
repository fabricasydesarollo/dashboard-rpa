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
import { AutorizacionBot } from '../../models/AutorizacionBot.js';
import { Maquina } from '../../models/Maquina.js';
import {Log } from '../../models/Log.js';
import { NotaCreditoMasiva } from '../../models/NotaCreditoMasiva.js';
import { Op } from 'sequelize';

export class BotRepository {

  static async create(botData, user_id) {
    const transaction = await Bot.sequelize.transaction();
    try {
      // antes de crear el bot validemos si el usuario es administrador si no lo es no puede crear un bot
      const user = await User.findByPk(user_id);
      //console.log('user: ',user_id);
      
      if (user.rol !== 'admin') {
        const error = new Error('Usuario No Autorizado');
        error.status = 401;
        throw error; 
      }
      // 1️ Crear el bot
      let newBot = await Bot.create(
        { nombre: botData.nombre,  descripcion: botData.descripcion,  estado: 'activo' },
        { transaction }
      );
      // crear la maquina inicial para el bot
      await Maquina.create({
        id: 1,
        bot_id: newBot.id,
        estado: 'activo',
        procesados: 0,
        total_registros: 0
      }, { transaction });

      // 2️ Buscar todos los usuarios con rol 'admin'
      const admins = await User.findAll({
        where: { rol: 'admin' },
        attributes: ['id'], // solo necesitamos el id
        transaction
      });
      // 3️ Crear las relaciones en la tabla intermedia
      const relaciones = admins.map(admin => ({
        user_id: admin.id,
        bot_id: newBot.id
      }));

      await UsuarioBot.bulkCreate(relaciones, { transaction });
      newBot = await Bot.findByPk(newBot.id, {
        include: { model: Maquina },
        transaction
      });

      // 4️ Confirmar la transacción
      await transaction.commit();

      return newBot;
    } catch (error) {
      await transaction.rollback();
      console.error('Error en BotRepository.create:', error);
      throw { status: 500, error: 'Error al crear el bot' };
    }
  }
  static async update(botData, user_id) {
    const transaction = await Bot.sequelize.transaction();
    try {
      // Verificar usuario admin
      const user = await User.findByPk(user_id);
      if (!user || user.rol !== 'admin') {
        throw { status: 401, error: 'Usuario No Autorizado' };
      }
      //  Buscar bot existente
      const bot = await Bot.findByPk(botData.id);
      if (!bot) {
        throw { status: 404, error: 'Bot no encontrado' };
      }
      //  Actualizar bot dentro de la transacción
      await bot.update(
        { nombre: botData.nombre, descripcion: botData.descripcion }, 
        { transaction }
      );
      //  Confirmar cambios
      await transaction.commit();
      //  Retornar el bot actualizado
      return bot;
    } catch (error) {
      await transaction.rollback();
      console.error('Error en BotRepository.update:', error);
      // Si el error ya tiene un status (401, 404, etc.), lo propagamos igual
      if (error.status) throw error;
      // Sino, lanzamos un error genérico
      throw { status: 500, error: 'Error al actualizar el bot' };
    }
  }

  static async delete(botId, user_id) {
    const transaction = await Bot.sequelize.transaction();
    try {
      // Verificar usuario admin
      const user = await User.findByPk(user_id);
      if (!user || user.rol !== 'admin') {
        throw { status: 401, error: 'Usuario No Autorizado' };
      }
      //  Buscar bot existente
      const bot = await Bot.findByPk(botId);
      if (!bot) {
        throw { status: 404, error: 'Bot no encontrado' };
      }
      //  Eliminar bot dentro de la transacción
      await bot.destroy({ transaction });
      //  Confirmar cambios
      await transaction.commit();
      //  Retornar el bot eliminado
    }
    catch (error) {
      await transaction.rollback();
      console.error('Error en BotRepository.delete:', error);
      // Si el error ya tiene un status (401, 404, etc.), lo propagamos igual
      if (error.status) throw error;
      // Sino, lanzamos un error genérico
      throw { status: 500, error: 'Error al eliminar el bot' };
    }
  }


  static async get({ user_id }) {
    const user = await User.findByPk(user_id, {
      include: {
        model: Bot,
        through: { attributes: [] },
        include: [ { model: Maquina,}]//  incluir máquinas asociadas al bot
      }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user.Bots; // Los bots vienen ya con maquinas incluidas
  }

  static async getAllBotMetrics(userId) {
    try {
      // 1️⃣ Buscar usuario con sus bots
      const user = await User.findByPk(userId, {
        include: {
          model: Bot,
          through: { attributes: [] },
          include: [ { model: Maquina,}]//  incluir máquinas asociadas al bot
        }});

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // 2️ Definir qué modelos usar
      const botRetiroUsuarios = [1, 2, 3];
      const botnotaCreditoMasivo = 4
      const botHistoriasClinicasId = 7;
      const botAutorizacionesId = 10;

      const metricas = [];

      // 3️ Iterar sobre los bots y consultar métricas con COUNT
      for (const bot of user.Bots) {
        let resultados = [];

        if (botRetiroUsuarios.includes(bot.id)) {
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
        }
          else if (bot.id === botAutorizacionesId) {
          resultados = await AutorizacionBot.findAll({
            where: { bot_id: bot.id },
            attributes: [
              'estado',
              [sequelize.fn('COUNT', sequelize.col('estado')), 'total']
            ],
            group: ['estado']
          });
        } else if (bot.id === botnotaCreditoMasivo) {
            resultados = await NotaCreditoMasiva.findAll({
              where: { bot_id: bot.id },
              attributes: [
                'estado',
                [sequelize.fn('COUNT', sequelize.col('estado')), 'total']
              ],
              group: ['estado']
            });
        }
        else {
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
      const botRetiroUsuarios = [1, 2, 3];
      const botHistoriasClinicasId = 7;
      const botAutorizacionesId = 10;
      const botnotaCreditoMasivo = 4;


      let Model;
      let estadoCampo = 'estado';

      if (botRetiroUsuarios.includes(botId)) {
        Model = Registro;
      } else if (botId === botHistoriasClinicasId) {
        Model = TrazabilidadEnvio;
        estadoCampo = 'estado_envio';
      } else if (botId === botnotaCreditoMasivo) {
        Model = NotaCreditoMasiva;
      } 
      else if (botId === botAutorizacionesId) {
        Model = AutorizacionBot;
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
      const bots = await Bot.findAll({
        attributes: { exclude: ['total_registros','procesados'] }, // 👈 excluye la contraseña
        include: { model: Maquina, attributes: ['id'] },
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
      const error = new Error('No se encontro el usuario');
      error.status = 404;
      throw error;
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
          buzon_compartido: form.buzon_compartido || "no",
          sucursal: form.sucursal || null
        }, { transaction });
        // 
        // 🔹 Traer solicitud con relaciones
        const solicitudConRelaciones = await SolicitudUsuario.findByPk(solicitud.id, {
          include: [
            { model: User, attributes: ['nombre','cargo'] },
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
    const hoy = new Date(); // fecha actual

    const solicitudes = await SolicitudUsuario.findAll({
      where: {
        estado: 'pendiente',
        fecha_inactivacion: {
          [Op.lte]: hoy // menor o igual a la fecha de hoy
        }
      },
      order: [['fecha_inactivacion', 'ASC']]
    });

    // ✅ Validar si hay solicitudes
    if (!solicitudes.length) {
      const error = new Error('No se encontraron solicitudes pendientes con fecha anterior o de hoy');
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

  static async getHistoriasClinicasPaginated({ user_id, search, fechaInicio, fechaFin, tipoDato }) {
    const user = await User.findByPk(user_id);
    if (!user) {
      const error = new Error('Usuario No Autorizado');
      error.status = 404;
      throw error;
    }

    const whereTraz = {};
    const searchA = search ? search.toLowerCase() : '';

    // 1. CONFIGURACIÓN DE CAMPO DE FILTRO Y ORDENAMIENTO
    // Determinamos si estamos filtrando por la tabla principal o la asociada
    const isFechaHistoria = tipoDato === 'fecha_historia';

    // Si es historia, usamos la sintaxis de asociación ($Modelo.campo$). Si es envío, campo normal.
    const campoFiltro = isFechaHistoria ? '$HistoriaClinica.fecha_historia$' : 'fecha_envio';

    // El ordenamiento también cambia de estructura
    let ordenamiento;
    if (isFechaHistoria) {
      // Ordenar por modelo asociado
      ordenamiento = [[{ model: HistoriaClinica }, 'fecha_historia', 'DESC']];
    } else {
      // Ordenar por modelo principal (por defecto fecha_envio DESC)
      ordenamiento = [['fecha_envio', 'DESC']];
    }

    // --- Fecha por defecto (solo si NO hay búsqueda ni fechas explícitas)
    if (!fechaInicio && !search) {
      fechaInicio = new Date().toLocaleDateString('sv-SE');
    }

    // --- LÓGICA DE FECHAS ---
    if (fechaInicio) {
      const inicioStr = `${fechaInicio} 00:00:00`;
      const finStr = fechaFin ? `${fechaFin} 23:59:59` : `${fechaInicio} 23:59:59`;

      if (isFechaHistoria) {
        // CASO A: Filtro por Fecha de Historia (Modelo Asociado)
        // Aquí NO nos importa si fecha_envio es null o no, solo miramos la fecha del documento
        whereTraz[campoFiltro] = {
          [Op.between]: [inicioStr, finStr]
        };
      } else {
        // CASO B: Filtro por Fecha de Envío (Modelo Principal)
        
        if (!search && !fechaFin) {
          whereTraz[Op.or] = [
            { [campoFiltro]: { [Op.between]: [inicioStr, finStr] } },
          ];
        } else {
          // Si es una búsqueda específica de rango, respetamos el rango estricto
          whereTraz[campoFiltro] = {
            [Op.between]: [inicioStr, finStr]
          };
        }
      }
    } else if (fechaFin) {
      // Lógica solo fechaFin
      whereTraz[campoFiltro] = {
        [Op.lte]: `${fechaFin} 23:59:59`
      };
    }

    // --- Filtro por búsqueda (Search) ---
    if (search) {
      const pattern = `%${searchA}%`;

      const searchCondition = {
        [Op.or]: [
          { '$HistoriaClinica.Paciente.nombre$': { [Op.like]: pattern } },
          { '$HistoriaClinica.Paciente.numero_identificacion$': { [Op.like]: pattern } },
          sequelize.where(sequelize.fn('LOWER', sequelize.col('HistoriaClinica.ingreso')), 'LIKE', pattern.toLowerCase()),
          sequelize.where(sequelize.fn('LOWER', sequelize.col('HistoriaClinica.folio')), 'LIKE', pattern.toLowerCase())
        ]
      };

      // Combinamos con lo que ya exista en whereTraz (sea fecha o nada)
      Object.assign(whereTraz, searchCondition);
    }

    const trazabilidades = await TrazabilidadEnvio.findAll({
      where: whereTraz,
      include: [
        {
          model: HistoriaClinica,
          attributes: ['ingreso', 'fecha_historia', 'folio', 'empresa', 'sede'],
          include: [
            {
              model: Paciente,
              attributes: ['nombre', 'numero_identificacion', 'correo_electronico'],
            }
          ]
        },
        {
          model: Bot,
          attributes: ['nombre']
        }
      ],
      order: ordenamiento, // <--- Usamos la variable dinámica
    });

    return trazabilidades;
  }

  static async getAutorizacionesPaginated({ search, fechaInicio, fechaFin, tipoDato }) {
    const whereTraz = {};
    const searchA = search ? search.toLowerCase() : '';

    // --- Fecha por defecto (solo si NO hay búsqueda ni fechas)
    if (!fechaInicio && !search) {
      fechaInicio = new Date().toLocaleDateString('sv-SE');
    }

    // --- Filtro por rango de fechas (solo si hay fechas)
    if (fechaInicio && fechaFin) {
      whereTraz[tipoDato] = {
        [Op.between]: [
          `${fechaInicio} 00:00:00`,
          `${fechaFin} 23:59:59`
        ]
      };
    } else if (fechaInicio) {
      whereTraz[tipoDato] = {
        [Op.between]: [
          `${fechaInicio} 00:00:00`,
          `${fechaInicio} 23:59:59`
        ]
      };
    } else if (fechaFin) {
      whereTraz[tipoDato] = {
        [Op.lte]: `${fechaFin} 23:59:59`
      };
    }

    // ---  Filtro por búsqueda: combinar paciente + historia en un solo [Op.or]
    if (search) {
      const pattern = `%${searchA}%`;
      whereTraz[Op.or] = [
        // Paciente
        { '$Paciente.nombre$': { [Op.like]: pattern } },
        { '$Paciente.numero_identificacion$': { [Op.like]: pattern } },
        // Campos directos de AutorizacionBot (case-insensitive en MySQL)
        { numIngreso: { [Op.like]: pattern } },
        { numFolio: { [Op.like]: pattern } },
        { nroAutorizacionRadicado: { [Op.like]: pattern } },
        { CUPS: { [Op.like]: pattern } },
        { idOrden: { [Op.like]: pattern } }
      ];
    }

    //console.log('FilterWhere final:', whereTraz);
    const autorizaciones = await AutorizacionBot.findAll({
      where: whereTraz,
      include: [
        {
          model: Paciente,
          attributes: ['numero_identificacion', 'nombre', 'correo_electronico'],
          required: true
        },
        {
          model: Bot,
          attributes: ['nombre']
        }
      ],
      order: [[tipoDato, 'DESC']]
    });
    
    
    if (!autorizaciones.length) {
      //console.log('autorizacion: ',autorizaciones);
      const error = new Error('No se encontraron autorizaciones');
      error.status = 404;
      throw error;
    }

    return autorizaciones;
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

  static async getAutorizaciones() {
    try {
      //cargar todas las autorizaciones
      const autorizaciones = await AutorizacionBot.findAll({
        include: [
          {
            model: Paciente,
            attributes: ['numero_identificacion', 'nombre', 'correo_electronico']
          },
          {
            model: Bot,
            attributes: ['nombre']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      
      if (!autorizaciones.length) {
        console.log('autorizacion: ',autorizaciones);
        const error = new Error('No se encontraron autorizaciones');
        error.status = 404;
        throw error;
      }

      return autorizaciones;
    } catch (error) {
      //console.error('Error en BotRepository.getAutorizaciones:', error);
      throw error;
    
    }

  }

  static async reprocesarHistoriaClinica(id){
    const trazabilidad = await TrazabilidadEnvio.findByPk(id);
    // verificar si existe la trazabilidad
    if (!trazabilidad) {
      const error = new Error('Trazabilidad no encontrada');
      error.status = 404;
      throw error;
    }
    // actualizar la trazabilidad
    await trazabilidad.update({ estado_envio: 'pendiente', motivo_fallo: null, fecha_envio: null });  
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

  static async getHistoriasClinicasWithError() {
    try {
      const historias = await TrazabilidadEnvio.findAll({
        where: { estado_envio: 'error', motivo_fallo: { [Op.like]: '%Error al procesar en indigo%' } },
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
          }
        ],
        order: [[HistoriaClinica, 'fecha_historia', 'ASC']]
      });
      return historias;
    } catch (error) {
      console.error( 'Error en BotRepository.getHistoriasClinicasWithError:', error );
      throw new Error('Error al obtener las historias clínicas con error en indigo');
    }
  }

}