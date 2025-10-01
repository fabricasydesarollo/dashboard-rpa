// Funciones para manejar notificaciones en tiempo real usando Socket.IO
function emitirNotificaciones(io, modulosConTipo = []) {
  modulosConTipo.forEach(({ modulo, tipo }) => {
    const notificacionNueva = enviarNotificacion(modulo, tipo);
    if (notificacionNueva) {
      io.emit('nueva_notificacion', notificacionNueva);
    }
  });
}

// Lógica para crear notificaciones basadas en eventos específicos
function enviarNotificacion(modulo, tipo) {
  let notificacion = null;

  switch (tipo) {
    //  Caso 1: Historia clínica / trazabilidad
    case 'historia_clinica':
      const trazabilidad = modulo;
      if (trazabilidad.estado_envio === 'error') {
        notificacion = {
          titulo: 'Error en envío de historia clínica',
          mensaje: `El envío de la historia clínica para el paciente <strong>${trazabilidad.HistoriaClinica.Paciente.nombre}</strong> con <strong>Ingreso ${trazabilidad.HistoriaClinica.ingreso}</strong> ha fallado.`,
          tipo: 'error',
          destino: {
            modal: 'HistoriaClinica',
            bot_id: trazabilidad.bot_id,
          }
        };
      }
      break;

    //  Caso 2: Bot
    case 'bot':
      const bot = modulo;
      if (bot.estado === 'error') {
        notificacion = {
          titulo: 'Error en ejecución del Bot',
          mensaje: `El bot <strong>${bot.nombre}</strong> ha presentado un error durante la ejecución.`,
          tipo: 'error',
          destino: {
            modal: 'tablero-bot',
            bot_id: bot.id,
          }
        };
      }
      if (bot.estado === 'pausado') {
        notificacion = {
          titulo: 'Bot pausado',
          mensaje: `El bot <strong>${bot.nombre}</strong> ha sido pausado.`,
          tipo: 'pausado',
          destino: {
            modal: 'tablero-bot',
            bot_id: bot.id,
          }
        };
      }
      break;

    //  Caso 3: Solicitud de usuario
    case 'solicitud_usuario':
      const solicitud = modulo;
      if (solicitud.estado === 'error') {
        notificacion = {
          titulo: 'Error en solicitud',
          mensaje: `La solicitud del usuario <strong>${solicitud.User?.nombre.toLowerCase()}</strong> para el bot <strong>${solicitud.Bot?.nombre}</strong> No pudo ser procesada.`,
          tipo: 'error',
          destino: {
            modal: 'solicitud_usuario',
            solicitud_id: solicitud.id,
          }
        };
      }
      if (solicitud.estado === 'exito') {
        notificacion = {
          titulo: 'Solicitud Procesada con Exito',
          mensaje: `La solicitud del usuario <strong>${solicitud.User?.nombre.toLowerCase()}</strong> para el bot <strong>${solicitud.Bot?.nombre}</strong> ha sido completada.`,
          tipo: 'exito',
          destino: {
            modal: 'solicitud_usuario',
            solicitud_id: solicitud.id,
          }
        };
      }
      break;

    //  Caso 4: Registro
    case 'registro':
      const registro = modulo;
      if (registro.estado === 'error') {
        notificacion = {
          titulo: 'Error en registro',
          mensaje: `El registro con mensaje: <em>"${registro.mensaje}"</em> ha fallado.`,
          tipo: 'error',
          destino: {
            modal: 'registros-bot',
            registro_id: registro.id,
            bot_id: registro.bot_id,
          }
        };
      }
      break;

    default:
      break;
  }

  return notificacion;
}

export const NotificationHelper = {
  emitirNotificaciones,
  enviarNotificacion
};