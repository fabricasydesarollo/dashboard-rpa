import { Router } from 'express';
import { BotController } from '../controllers/bot.controller.js';
import { authenticateToken } from '../middlewares/auth-middleware.js';
import { UserController } from '../controllers/user.controller.js';


const router = Router();

router.get('/get',authenticateToken, BotController.get);
router.get('/get/registros',authenticateToken, BotController.getRegistros);
router.get('/get/users',authenticateToken, BotController.getUsers);
router.get('/get/bots',authenticateToken, BotController.getBots);
router.get('/get/solicitudes/usuario',authenticateToken, UserController.getSolicitudes);
router.get('/descargar-formato',authenticateToken, BotController.descargarFormato);
router.post('/add/bots/user',authenticateToken, BotController.addBotsToUser);
router.post('/update/user/rol',authenticateToken, BotController.updateUserRol);
router.post('/create/solicitud',authenticateToken, BotController.createSolicitud);


export default router;
