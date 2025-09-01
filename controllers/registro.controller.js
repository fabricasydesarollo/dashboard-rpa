import jwt from 'jsonwebtoken';
import { Registro } from '../models/Registro.js';
import { Bot } from '../models/Bot.js';
import { User } from '../models/User.js';
import { SolicitudUsuario} from '../models/SolicitudUsuario.js';
import { sequelize } from '../db/database.js';
//import { UserRepository } from '../services/repositories/user-repository.js';

export const RegistroController = {
  async create(req, res) {
    const t = await sequelize.transaction(); // crea la transacción
    try {
      const registro = req.body;

      // 1. Crear el registro y actualizar bot en paralelo
      const [nuevoRegistro] = await Promise.all([
        Registro.create({
          bot_id: registro.bot_id,
          solicitud_id: registro.solicitud_id,
          mensaje: registro.mensaje,
          estado: registro.estado,
          fecha_ejecucion: registro.fecha_ejecucion || new Date(),
          duracion: registro.duracion
        }, { transaction: t }),

        Bot.update({
          total_registros: registro.total_registros,
          updatedAt: new Date(),
          procesados: registro.procesados
        }, {
          where: { id: registro.bot_id },
          transaction: t
        })
      ]);

      
      await SolicitudUsuario.update(
        { estado: nuevoRegistro.estado },
        { where: { id: registro.solicitud_id },
        transaction: t 
      });

      const bot = await Bot.findByPk(registro.bot_id, { transaction: t });
      const solicitud = await SolicitudUsuario.findByPk(registro.solicitud_id, {
        include: [
          { model: User, attributes: ['nombre'] },
          { model: Bot, attributes: ['nombre'] }
        ], 
        transaction: t 
        });
      //console.log('solicitud actualizada', solicitud);
      // 3. Confirmar (commit)
      await t.commit();

      // Emitir a todos los clientes conectados
      const io = req.app.get('io');
      io.emit('nuevo_registro', nuevoRegistro, bot, solicitud);

      res.json({ ok: true, nuevoRegistro, bot, solicitud });

    } catch (error) {
      // ❌ Revertir si algo falla
      await t.rollback();
      console.error('Error al crear registro (rollback ejecutado):', error);
      res.status(500).json({ ok: false, error: 'Error al crear registro' });
    }
  }

};

