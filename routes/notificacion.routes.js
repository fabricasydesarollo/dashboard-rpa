// routes/notificacion.routes.js
import { Router } from 'express';
import { NotificacionController } from '../controllers/notificacion.controller.js';
import { authenticateToken } from '../middlewares/auth-middleware.js';

const router = Router();

// Todas requieren autenticación
router.get('/', authenticateToken, NotificacionController.getNotificaciones);
router.post('/', authenticateToken, NotificacionController.createNotificacion);
router.patch('/:id/leido', authenticateToken, NotificacionController.markAsRead);
router.delete('/:id', authenticateToken, NotificacionController.deleteNotificacion);

export default router;
