import { Router } from 'express';
import { RegistroController } from '../controllers/registro.controller.js';
import { SocketController } from '../controllers/socket.controller.js';

const router = Router();

router.post('/nuevo-registro-avidanti', SocketController.createRegistroAvidanti);
router.post('/nueva-historia-clinica', SocketController.createOrUpdateHistoriaClinica);
router.post('/nuevo-registro-bots', SocketController.createRegistroGeneral);
router.post('/nuevo-log-bot', SocketController.createLogBot);
router.post('/nueva-autorizacion', SocketController.createAutorizacion);
router.post('/actualizar-nota-credito-avidanti', SocketController.actualizarNotaCreditoAvidanti);

export default router;
