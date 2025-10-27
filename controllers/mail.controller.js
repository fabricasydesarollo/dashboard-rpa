
import { sendMail } from '../services/msgraphMailer.js';

export const MailController = {
  async enviarCorreo(req, res) {
    try {
      const { destinatario } = req.body;

      if (!destinatario?.length) {
        return res.status(400).json({ error: 'Debe enviar al menos un destinatario' });
      }

      await sendMail({
        to: destinatario,
        subject: '⚠️ Error en solicitud del sistema',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
            <h2 style="color: #c0392b;">🚨 Error en solicitud</h2>
            <p style="font-size: 15px;">
              Se detectó un error al procesar la <strong>solicitud de retiro de usuario</strong>
            </p>

            <table style="border-collapse: collapse; margin: 15px 0;">
              <tr>
                <td style="padding: 6px 10px;"><strong>👤 Usuario afectado:</strong></td>
                <td style="padding: 6px 10px;">Carlos Bermudes Gallego</td>
              </tr>
              <tr>
                <td style="padding: 6px 10px;"><strong>🆔 ID:</strong></td>
                <td style="padding: 6px 10px;">1006294135</td>
              </tr>
              <tr>
                <td style="padding: 6px 10px;"><strong>🤖 Bot afectado:</strong></td>
                <td style="padding: 6px 10px;">Bot Retiro De Usuario Avidanti</td>
              </tr>
              <tr>
                <td style="padding: 6px 10px;"><strong>👨‍💼 Responsable:</strong></td>
                <td style="padding: 6px 10px;">Juan Pérez (Coordinador de TI)</td>
              </tr>
            </table>

            <p style="margin-top: 15px; font-size: 14px; color: #555;">
              Por favor, revise los registros de ejecución o comuníquese con el equipo de soporte técnico para resolver el inconveniente.
            </p>

            <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;" />

            <p style="font-size: 13px; color: #888;">
              <em>Notificación automática generada por el Sistema de Monitoreo de Bots.</em>
            </p>
          </div>
        `,
      });

      res.json({ ok: true, mensaje: 'Correo enviado correctamente' });
    } catch (error) {
      console.error('❌ Error en /send-error-mail:', error.message);
      res.status(500).json({ ok: false, error: 'No se pudo enviar el correo' });
    }
  }
}