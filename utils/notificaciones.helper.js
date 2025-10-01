import { Notificacion } from '../models/Notificacion.js';
import { NotificationService } from '../services/NotificationService.js';


// Funciones para manejar notificaciones en tiempo real usando Socket.IO
import { User } from '../models/User.js';
import { Bot } from '../models/Bot.js';

async function emitirNotificaciones(io, modulosConTipo = []) {
  for (const { modulo, tipo } of modulosConTipo) {
    const notificacionesNuevas = await enviarNotificacion(modulo, tipo);
    
    if (notificacionesNuevas && notificacionesNuevas.length > 0) {
      for (const notificacion of notificacionesNuevas) {
        console.log('Emitiendo notificación via Socket.IO:', notificacion.toJSON());
        io.emit('nueva_notificacion', notificacion.toJSON());
      }
    }
  }
}


// Lógica para crear notificaciones basadas en eventos específicos
async function enviarNotificacion(modulo, tipo) {
  let notificacionBase = null;
  let destinatarios = []; // Array de user_id

  switch(tipo) {
    case 'bot':
      const bot = modulo; // ya es instancia de Bot (Sequelize)

      // Obtenemos todos los usuarios asociados al bot
      const usuariosBot = await bot.getUsers(); 
      destinatarios = usuariosBot.map(u => u.id);

      if (bot.estado === 'error') {
        notificacionBase = {
          titulo: 'Error en ejecución del Bot',
          mensaje: `El bot <strong>${bot.nombre}</strong> ha presentado un error durante la ejecución.`,
          tipo: 'error',
          destino: { modal: 'tablero-bot', bot_id: bot.id }
        };
      } else if (bot.estado === 'pausado') {
        notificacionBase = {
          titulo: 'Bot pausado',
          mensaje: `El bot <strong>${bot.nombre}</strong> ha sido pausado.`,
          tipo: 'advertencia',
          destino: { modal: 'tablero-bot', bot_id: bot.id }
        };
      }
      break;

    case 'solicitud_usuario':
      const solicitud = modulo;
      destinatarios = [solicitud.user_id]; // solo el dueño de la solicitud

      if (solicitud.estado === 'error') {
        notificacionBase = {
          titulo: 'Error en solicitud',
          mensaje: `La solicitud del usuario <strong>${solicitud.User?.nombre.toLowerCase()}</strong> para el bot <strong>${solicitud.Bot?.nombre}</strong> no pudo ser procesada.`,
          tipo: 'error',
          destino: { modal: 'solicitud_usuario', solicitud_id: solicitud.id }
        };
      } else if (solicitud.estado === 'exito') {
        notificacionBase = {
          titulo: 'Solicitud procesada con éxito',
          mensaje: `La solicitud del usuario <strong>${solicitud.User?.nombre.toLowerCase()}</strong> para el bot <strong>${solicitud.Bot?.nombre}</strong> ha sido completada.`,
          tipo: 'exito',
          destino: { modal: 'solicitud_usuario', solicitud_id: solicitud.id }
        };
      }
      break;

    case 'historia_clinica': 
      const trazabilidad = modulo;

      // Obtenemos el bot con sus usuarios asociados
      const botConUsuarios = await Bot.findByPk(trazabilidad.bot_id, {
        include: [{ model: User, through: { attributes: [] } }] // trae users sin datos extra de UsuarioBot
      });
      console.log('bot con usuarios para notificación historia clinica:', botConUsuarios);
      
      // Los destinatarios son todos los usuarios asociados a ese bot
      destinatarios = botConUsuarios?.Users?.map(u => u.id) || [];

      if (trazabilidad.estado_envio === 'error') {
        notificacionBase = {
          titulo: 'Error en envío de historia clínica',
          mensaje: `El envío de la historia clínica para el paciente <strong>${trazabilidad.HistoriaClinica.Paciente.nombre}</strong> con ingreso <strong>${trazabilidad.HistoriaClinica.ingreso}</strong> ha fallado.`,
          tipo: 'error',
          destino: { modal: 'HistoriaClinica', bot_id: trazabilidad.bot_id }
        };
      }
      console.log('destinatarios historia clinica:', destinatarios);
      
      break;

    case 'registro':
      const registro = modulo;

      // Asegurarse de tener el bot asociado
      const botRelacionado =  await Bot.findByPk(registro.bot_id);

      const usuariosRegistro = await botRelacionado.getUsers();
      destinatarios = usuariosRegistro.map(u => u.id);

      if (registro.estado === 'error') {
        notificacionBase = {
          titulo: 'Error en registro',
          mensaje: `El registro con mensaje: <em>"${registro.mensaje}"</em> ha fallado.`,
          tipo: 'error',
          destino: { modal: 'registros-bot', registro_id: registro.id, bot_id: registro.bot_id }
        };
      }
      break;


    default:
      return [];
  }

  // Creamos una notificación por cada usuario destinatario
  const notificacionesCreadas = [];
  for (const userId of destinatarios) {
    if (!notificacionBase) continue; // nada que notificar
    const creada = await NotificationService.create(userId, notificacionBase.titulo, notificacionBase.mensaje, notificacionBase.tipo, notificacionBase.destino);
    notificacionesCreadas.push(creada);
  }

  return notificacionesCreadas;
}


export const NotificationHelper = {
  emitirNotificaciones,
  enviarNotificacion
};