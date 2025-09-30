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
router.post('/mark-all-read', authenticateToken, NotificacionController.markAllAsRead);
router.delete('/delete-all', authenticateToken, NotificacionController.deleteAll);


export default router;
