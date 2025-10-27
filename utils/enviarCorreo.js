import { sendMail } from '../services/msgraphMailer.js';

/**
 * Crea la estructura de correo según el tipo de módulo.
 */
function crearEstructura(modelo, tipoModulo) {
  let subject = '';
  let htmlBody = '';

  switch (tipoModulo) {
    case 'solicitud_usuario':
      subject = '🚨 Error en solicitud';

      htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h2 style="color: #c0392b;"> Error en solicitud</h2>
          <p style="font-size: 15px;">
            Se detectó un error al procesar la <strong>solicitud de retiro de usuario</strong>.
          </p>

          <table style="border-collapse: collapse; margin: 15px 0;">
            <tr><td style="padding: 6px 10px;"><strong>👤 Usuario afectado:</strong></td><td>${modelo.nombre}</td></tr>
            <tr><td style="padding: 6px 10px;"><strong>🆔 ID:</strong></td><td>${modelo.identificacion}</td></tr>
            <tr><td style="padding: 6px 10px;"><strong>🤖 Bot afectado:</strong></td><td>${modelo.Bot?.nombre ?? 'N/A'}</td></tr>
            <tr><td style="padding: 6px 10px;"><strong>👨‍💼 Responsable:</strong></td><td>${modelo.User?.nombre ?? 'Desconocido'}</td></tr>
          </table>

          <p style="margin-top: 15px; font-size: 14px; color: #555;">
            Por favor, revise los registros de ejecución o comuníquese con el equipo de soporte técnico para resolver el inconveniente.
          </p>

          <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;" />
          <p style="font-size: 13px; color: #888;">
            <em>Notificación automática generada por el Sistema de Monitoreo de Bots.</em>
          </p>
        </div>
      `;
      break;

    default:
      subject = '🔔 Notificación del sistema';
      htmlBody = `
        <p>No hay plantilla definida para el módulo: <strong>${tipoModulo}</strong></p>
      `;
  }

  return { subject, htmlBody };
}

/**
 * Envía un correo electrónico según el tipo de módulo.
 */
export async function enviarCorreo(modelo, tipoModulo) {
  try {
    const { subject, htmlBody } = crearEstructura(modelo, tipoModulo);

    const to = ['maykol.plazac@zentria.com.co']; // dinámico o por defecto

    await sendMail({ to, subject, htmlBody });

    console.log(`📧 Correo enviado a ${to} (${tipoModulo})`);
  } catch (error) {
    console.error('❌ Error al enviar correo:', error.message);
  }
}
