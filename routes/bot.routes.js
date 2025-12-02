import { Router } from 'express';
import { BotController } from '../controllers/bot.controller.js';
import { authenticateToken } from '../middlewares/auth-middleware.js';
import { UserController } from '../controllers/user.controller.js';
import { HistoriaClinicaController } from '../controllers/historiaClinica.controller.js';
import { LogController } from '../controllers/logController.js';
import { NotaCreditoController } from '../controllers/notaCreditoController.js';
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() }); // guardamos en memoria (buffer)

const router = Router();

// crea un nuevo bot
router.post('/',authenticateToken, BotController.create);
// actualizar bot
router.put('/',authenticateToken, BotController.update);
// elimina un bot
router.delete('/',authenticateToken, BotController.delete);
// obtiene todos los bots
router.get('/get',authenticateToken, BotController.get);
// obtiene los registros de un bot en especifico, recibe el parametro botId en req.query
router.get('/get/registros',authenticateToken, BotController.getRegistros); 
// obtiene todos los usuarios
router.get('/get/users',authenticateToken, BotController.getUsers);
// obtiene todos los bots
router.get('/get/bots',authenticateToken, BotController.getBots);
 // obtiene las solicitudes de un usuario, recibe el parametro userId en req.query
router.get('/get/solicitudes/usuario',authenticateToken, UserController.getSolicitudes);
// obtiene todas las historias clinicas
router.get('/get/historiasClinicas',authenticateToken, HistoriaClinicaController.get);
 // descarga el formato de historia clinica
router.get('/descargar-formato',authenticateToken, BotController.descargarFormato);
// agrega bots a un usuario
router.post('/add/bots/user',authenticateToken, BotController.addBotsToUser);
// actualiza el rol de un usuario
router.post('/update/user/rol',authenticateToken, BotController.updateUserRol);
// crea una solicitud para inactivar usuario avidanti
router.post('/create/solicitud',authenticateToken, BotController.createSolicitud);
// recibe el parametro en req.query debe ser la maquinaId
router.get('/historias-clinicas/pendientes', HistoriaClinicaController.getHistoriasClinicasPendientes); 
// obtiene todos los logs del bot, recibe parametro en req.query botId
router.get('/logs', authenticateToken, LogController.get); 
// ruta para traer las fechas de los logs con estado 'error' o 'listo'
router.get('/logs/fechas', LogController.getFechas);
// elimina un usuario
router.delete('/delete/user', authenticateToken, UserController.deleteUser); 
// crea un usuario
router.post('/create/user', authenticateToken, UserController.createUser);
//activar bot patologia
router.post('/activar-bot-patologia', authenticateToken, BotController.activateBotPatologia);
// obtiene todas las metricas de los bots asociados a un usuario
router.get('/allmetricas', authenticateToken, BotController.getAllBotMetrics); 
// obtiene las metricas de un bot en especifico recibe el parametro botId en req.query
router.get('/metricas/bot', authenticateToken, BotController.getBotMetrics); 
//obtener solicitudes pendientes
router.get('/solicitudes/pendientes', BotController.getPendingSolicitudes);
// reprocesar historia clinica
router.put('/reprocesar/historia-clinica/:id', authenticateToken, HistoriaClinicaController.reprocesarHistoriaClinica);
// Crear una nueva autorización
router.post('/autorizacion', BotController.createAutorizacion);
// obtener todas las autorizaciones
router.get('/autorizaciones', authenticateToken, BotController.getAutorizaciones);
// cargar las notas credito masivas
router.post('/cargar/notas-credito', authenticateToken, upload.single('archivo'), NotaCreditoController.cargarNotasCredito);

export default router;
