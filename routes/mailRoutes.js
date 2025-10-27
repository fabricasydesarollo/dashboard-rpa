import express from 'express';
import { sendMail } from '../services/msgraphMailer.js';
import { MailController } from '../controllers/mail.controller.js';

const router = express.Router();

// Enviar correo automático (por ejemplo, cuando hay error en solicitudes)
router.post('/send-mail', MailController.enviarCorreo);

export default router;
