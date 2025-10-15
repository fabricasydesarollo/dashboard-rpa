import { Router } from 'express';
import { RegistroController } from '../controllers/registro.controller.js';
import { SocketController } from '../controllers/socket.controller.js';

const router = Router();

router.post('/nuevo-registro-avidanti', SocketController.createRegistroAvidanti);
router.post('/nueva-historia-clinica', SocketController.createOrUpdateHistoriaClinica);
router.post('/nuevo-registro-bots', SocketController.createRegistroGeneral);

export default router;
