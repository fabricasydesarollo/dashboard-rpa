// controllers/notificacion.controller.js
import { NotificationService } from '../services/NotificationService.js';

export class NotificacionController {
  static async getNotificaciones(req, res) {
    try {
      const userId = req.user.user_id; // viene del middleware authenticateToken
      const notificaciones = await NotificationService.getByUser(userId);
      res.json({ status: 'ok', data: notificaciones });
    } catch (err) {
      console.log(err);
      return res.status(err.status || 500).json({ error: err.error || 'Error al obtener las notificaciones' });
    }
  }

  static async createNotificacion(req, res) {
    try {
      const { titulo, mensaje, tipo, destino } = req.body;
      const userId = req.user.user_id; // se asocia al usuario autenticado
      const notificacion = await NotificationService.create(userId, titulo, mensaje, tipo, destino);
      res.status(201).json({ status: 'ok', data: notificacion });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      await NotificationService.markAsRead(id);
      res.json({ status: 'ok', message: 'Notificación marcada como leída' });
    } catch (err) {
      console.log(err);
      return res.status(err.status || 500).json({ error: err.error || 'Error al Actualizar notificacion' });
    }
  }

  static async deleteNotificacion(req, res) {
    try {
      const { id } = req.params;
      await NotificationService.delete(id);
      res.json({ status: 'ok', message: 'Notificación eliminada' });
    } catch (err) {
      console.log(err);
      return res.status(err.status || 500).json({ error: err.error || 'Error al Eliminar notificacion' });
    }
  }

  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.user_id;
      await NotificationService.markAllAsRead(userId);
      res.json({ status: 'ok', message: 'Todas las notificaciones fueron marcadas como leídas' });
    } catch (err) {
      console.log(err);
      return res.status(err.status || 500).json({ error: err.error || 'Error al marcar todas las notificaciones como leídas' });
    }
  }

  static async deleteAll(req, res) {
    try {
      const userId = req.user.user_id;
      await NotificationService.deleteAllNotificaciones(userId);
      console.log(`Todas las notificaciones del usuario ${userId} fueron eliminadas`);
      
      res.json({ status: 'ok', message: 'Todas las notificaciones fueron eliminadas' });
    } catch (err) {
      console.log(err);
      return res.status(err.status || 500).json({ error: err.error || 'Error al eliminar todas las notificaciones' });
    }
  }

}
