import { Router } from 'express';
import { RegistroController } from '../controllers/registro.controller.js';
import { SocketController } from '../controllers/socket.controller.js';

const router = Router();

router.post('/nuevo-registro', SocketController.createRegistro);

export default router;
