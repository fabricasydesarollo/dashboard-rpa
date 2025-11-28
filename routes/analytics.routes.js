import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth-middleware.js';
import { AnalyticsController } from '../controllers/analytics.controller.js';

const router = Router();

// actualizar datos del usuario
router.get('/kpis', AnalyticsController.getKpis);
router.get('/registros-bots', AnalyticsController.getRegistrosPorBotHoy);
router.get('/procesados-por-maquina', AnalyticsController.getProcesadosPorMaquina);

export default router;
