import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth-middleware.js';
import { AnalyticsController } from '../controllers/analytics.controller.js';

const router = Router();

// actualizar datos del usuario
router.get('/kpis', authenticateToken, AnalyticsController.getKpis);
router.get('/registros-bots', authenticateToken, AnalyticsController.getRegistrosPorBotHoy);
router.get('/procesados-por-maquina', authenticateToken, AnalyticsController.getProcesadosPorMaquina);
router.get('/envios-historias', authenticateToken, AnalyticsController.getEnviosHistoriasClinicas);
router.get('/tiempos-ejecucion', authenticateToken, AnalyticsController.getTiemposEjecucion);
router.get('/distribucion-estados', authenticateToken, AnalyticsController.getDistribucionEstados);
router.get('/solicitudes-inactivacion', authenticateToken, AnalyticsController.getSolicitudesInactivacion);

export default router;
