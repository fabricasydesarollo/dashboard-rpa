import { User } from '../../models/User.js' // Asegúrate de que la ruta esté correcta
import { Bot } from '../../models/Bot.js'
import { Registro } from '../../models/Registro.js';
import { UsuarioBot } from '../../models/UsuarioBot.js';
import { sequelize } from '../../db/database.js';
import { SolicitudUsuario } from '../../models/SolicitudUsuario.js';

export class BotRepository {
  static async get({ user_id, rol }) {
    if (rol === 'admin') {
      // Devuelve todos los bots
      return await Bot.findAll();
    } else {
      // Devuelve solo los bots asociados al usuario
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
  }

  static async getRegistros({ bot_id }) {
    let registros = await Registro.findAll({
      where: { bot_id },
      order: [['fecha_ejecucion', 'DESC']], // Ordenar por fecha de ejecución MAS ACTUAL
      limit: 100, // Limitar a los últimos 100 registros  
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

    // Actualizar usando Sequelize
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
        // se va a enviar al bot el arreglo solicitudes pero solo con la informacion de la solicitud creada
        solicitudesToBot.push(solicitud);
        //aqui va la api que se va a mandar las solicitudes al bot 
        await axios.post("http://191.89.40.37:8001/desactivar", solicitudesToBot, {
          headers: {
            "Content-Type": "application/json"
          }
        });
        // se va a enviar al cliente la solicitud con las relaciones
        solicitudes.push(solicitudConRelaciones);
      }

      return solicitudes;
    });
  }


}