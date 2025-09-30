// services/NotificationService.js
import { Notificacion } from '../models/Notificacion.js';

export class NotificationService {
  /**
   * Crear una nueva notificación
   * @param {number} user_id - ID del usuario al que pertenece
   * @param {string} titulo - Título corto de la notificación
   * @param {string} mensaje - Mensaje detallado
   * @param {string} tipo - Tipo de notificación (info, advertencia, error, exito)
   * @returns {Promise<Notificacion>}
   */
  static async create(user_id, titulo, mensaje, tipo = 'info', destino) {
    try {
      const notificacion = await Notificacion.create({
        user_id,
        titulo,
        mensaje,
        tipo,
        destino: destino?.modal || null,
      });
      return notificacion;
    } catch (error) {
      throw new Error(`Error al crear notificación: ${error.message}`);
    }
  }

  /**
   * Obtener todas las notificaciones de un usuario
   * @param {number} user_id - ID del usuario
   * @returns {Promise<Notificacion[]>}
   */
  static async getByUser(user_id) {
    try {
      return await Notificacion.findAll({
        where: { user_id },
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      throw new Error(`Error al obtener notificaciones: ${error.message}`);
    }
  }

  /**
   * Marcar una notificación como leída
   * @param {number} id - ID de la notificación
   * @returns {Promise<void>}
   */
  static async markAsRead(id) {
    try {
      await Notificacion.update({ leido: true }, { where: { id } });
    } catch (error) {
      throw new Error(`Error al marcar como leída: ${error.message}`);
    }
  }

   /**
   * Eliminar una notificación
   * @param {number} id - ID de la notificación
   * @returns {Promise<void>}
   */
  static async delete(id) {
    try {
      await Notificacion.destroy({ where: { id } });
    } catch (error) {
      throw new Error(`Error al eliminar notificación: ${error.message}`);
    }
  }

  /** 
   * Marcar todas las notificaciones de un usuario como leídas
   * @param {number} userId - ID del usuario
   * @returns {Promise<void>}
  */
  static async markAllAsRead(userId) {
    try {
      await Notificacion.update(
        { leido: true },
        { where: { user_id: userId } }
      );
    } catch (error) {
      throw new Error(`Error al marcar las notificaciones como leidas: ${error}`);
    }
  }
  /** 
   * Eliminar todas las notificaciones de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<void>}
  */
  static async deleteAll(userId) {
    try {
      await Notificacion.destroy({ where:  { user_id: userId } });
    } catch (error) {
      throw new Error(`Error al eliminar todas las notificaciones: ${error}`);
    }
  
  }

 
}
