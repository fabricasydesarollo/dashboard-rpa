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
// obtiene todas las historias clinicas recibiendo parametros como busqueda y fecha 
router.get('/get/historiasClinicas/op',authenticateToken, HistoriaClinicaController.getPaginated);
 // descarga el formato de Notas credito
router.get('/descargar-formato/nota-credito',authenticateToken, BotController.descargarFormatoNotaCredito);
 // descarga el formato de Retiro usuarios masivo
router.get('/descargar-formato/retiro-usuarios',authenticateToken, BotController.descargarFormatoRetiroUsuarios);
// agrega bots a un usuario
router.post('/add/bots/user',authenticateToken, BotController.addBotsToUser);
// actualiza el rol de un usuario
router.post('/update/user/rol',authenticateToken, BotController.updateUserRol);
// crea una solicitud para inactivar usuario avidanti
router.post('/create/solicitud',authenticateToken, BotController.createSolicitud);
// crea una solicitud para inactivar usuario avidanti de manera masiva
router.post('/create/solicitud/masiva',authenticateToken, upload.single('archivo'), BotController.createSolicitudMasiva);
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
// obtener todas las autorizaciones recibiendo como parametros busqueda y fecha
router.get('/autorizaciones/op', authenticateToken, BotController.getAutorizacionesPaginated);
// cargar las notas credito masivas
router.post('/cargar/notas-credito', authenticateToken, upload.single('archivo'), NotaCreditoController.cargarNotasCredito);
// obtener las notas credito masivas del bot avidanti
router.get('/notas-credito-avidanti', authenticateToken, NotaCreditoController.get);
// obtener las notas credito pendientes para que el bot las procese
router.get('/notas-credito-pendientes', NotaCreditoController.getNotasCreditotoBotPendientes);
// obtener las historias clinicas que tienen motivo de fallo 'Error al procesar en indigo'
router.get('/historias-clinicas/error-indigo', HistoriaClinicaController.getHistoriasClinicasWithErrorIndigo);

export default router;
