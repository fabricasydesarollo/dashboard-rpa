import { Router } from 'express';
import { RegistroController } from '../controllers/registro.controller.js';
import { SocketController } from '../controllers/socket.controller.js';

const router = Router();

router.post('/nuevo-registro', SocketController.createRegistro);
router.post('/nueva-historia-clinica', SocketController.createOrUpdateHistoriaClinica);

export default router;
