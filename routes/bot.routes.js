import { Router } from 'express';
import { BotController } from '../controllers/bot.controller.js';
import { authenticateToken } from '../middlewares/auth-middleware.js';
import { UserController } from '../controllers/user.controller.js';
import { HistoriaClinicaController } from '../controllers/historiaClinica.controller.js';
import { LogController } from '../controllers/logController.js';


const router = Router();

router.get('/get',authenticateToken, BotController.get);
router.get('/get/registros',authenticateToken, BotController.getRegistros);
router.get('/get/users',authenticateToken, BotController.getUsers);
router.get('/get/bots',authenticateToken, BotController.getBots);
router.get('/get/solicitudes/usuario',authenticateToken, UserController.getSolicitudes);
router.get('/get/historiasClinicas',authenticateToken, HistoriaClinicaController.get);
router.get('/descargar-formato',authenticateToken, BotController.descargarFormato);
router.post('/add/bots/user',authenticateToken, BotController.addBotsToUser);
router.post('/update/user/rol',authenticateToken, BotController.updateUserRol);
router.post('/create/solicitud',authenticateToken, BotController.createSolicitud);
router.get('/historias-clinicas/pendientes', HistoriaClinicaController.getHistoriasClinicasPendientes);
router.get('/historias-clinicas/pendientes', HistoriaClinicaController.getHistoriasClinicasPendientes);
router.get('/logs', authenticateToken, LogController.get);
router.delete('/delete/user', authenticateToken, UserController.deleteUser);
router.post('/create/user', authenticateToken, UserController.createUser);


export default router;
