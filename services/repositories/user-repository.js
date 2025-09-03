import bcrypt from 'bcrypt'
import { User } from '../../models/User.js' // Asegúrate de que la ruta esté correcta
import { Bot } from '../../models/Bot.js'
import { SolicitudUsuario } from '../../models/SolicitudUsuario.js'
import { Registro } from '../../models/Registro.js';

class Validation {
  static Email(email) {
    if (typeof email !== 'string') {
      throw { status: 400, error: { email: ['El email debe ser una cadena'] } }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw { status: 400, error: { email: ['El formato del email no es válido'] } }
    }
  }

  static Password(password) {
    if (typeof password !== 'string') {
      throw { status: 400, error: { password: ['El password debe ser una cadena'] } }
    }
    if (password.length < 6) {
      throw { status: 400, error: { password: ['El password debe tener al menos 6 caracteres'] } }
    }
  }
}

export class UserRepository {
  static async create(data) {
    const { email, password, rol } = data
    Validation.Email(email)
    Validation.Password(password)

    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      throw { status: 400, error: { email: ['El usuario ya está registrado'] } }
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = await User.create({
      email,
      password: hashedPassword,
      rol: rol || 'usuario' // Asigna 'usuario' por defecto si no se proporciona
    })

    console.log('Usuario creado:', newUser)
    return newUser.id
  }

  static async login({ email, password }) {
    Validation.Email(email)
    Validation.Password(password)

    const user = await User.findOne({ where: { email } })
    if (!user) {
      throw { status: 400, error: { email: ['El usuario no existe'] } }
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      throw { status: 400, error: { password: ['Contraseña incorrecta'] } }
    }

    return user
  }
  
  static async getSolicitudes(user_id, rol) {
    try {
      let whereCondition = {};
      
      if (rol === 'usuario') {
        // Caso usuario normal → solo las suyas
        whereCondition = { user_id };
      } else if (rol === 'supervisor') {
        // Caso supervisor → necesita saber qué bots tiene asignados
        const user = await User.findByPk(user_id, {
          include: {
            model: Bot,
            through: { attributes: ['bot_id'] } // 
          }
        });

        const botsAsignados = user ? user.Bots : []
        const botIds = botsAsignados.map(b => b.id);
        //console.log('Bots asignados al supervisor:', botIds);
        whereCondition = {
          bot_id: botIds.length > 0 ? botIds : null
        };
      }
      // Caso admin → whereCondition queda vacío {} 
      const solicitudes = await SolicitudUsuario.findAll({
        where: whereCondition,
        include: [
          { model: User, attributes: ['nombre'] },
          { model: Bot, attributes: ['nombre'] },
          { model: Registro, as: 'Registro', attributes: ['mensaje'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      return solicitudes;
    } catch (error) {
      console.error('Error al obtener las solicitudes:', error);
      throw error;
    }
  }



}
