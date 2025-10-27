// src/services/msgraphMailer.js
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as msal from '@azure/msal-node';
import dotenv from 'dotenv';

dotenv.config();

const tenantId = process.env.TENANT_ID;
const clientMailId = process.env.MAIL_CLIENT_ID;  //
const clientMailSecret = process.env.MAIL_CLIENT_SECRET; //
const senderUserId = process.env.SENDER_USER_ID;

const msalConfig = {
  auth: {
    clientId: clientMailId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    clientSecret : clientMailSecret
  },
};

const cca = new msal.ConfidentialClientApplication(msalConfig);
const scopes = ['https://graph.microsoft.com/.default'];

async function getAccessToken() {
  try {
    const result = await cca.acquireTokenByClientCredential({ scopes });
    return result.accessToken;
  } catch (error) {
    console.error('❌ Error al obtener token MSAL:', error.message);
    throw error;
  }
}

/**
 * Envía un correo usando Microsoft Graph API
 * @param {Object} params
 * @param {string[]} params.to - Lista de destinatarios
 * @param {string} params.subject - Asunto del correo
 * @param {string} params.htmlBody - Contenido HTML del correo
 * @param {Array<{ path: string, filename?: string }>} [params.attachments] - Archivos adjuntos
 */
export async function sendMail({ to, subject, htmlBody, attachments = [] }) {
  try {
    const token = await getAccessToken();
    const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderUserId)}/sendMail`;
    //console.log('to: ',to);
    

    const toRecipients = to.map((email) => ({
      emailAddress: { address: email },
    }));

    const graphAttachments = [];

    for (const file of attachments) {
      const content = fs.readFileSync(file.path);
      const base64Content = content.toString('base64');
      graphAttachments.push({
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: file.filename || path.basename(file.path),
        contentBytes: base64Content,
      });
    }

    const message = {
      message: {
        subject,
        body: {
          contentType: 'HTML',
          content: htmlBody,
        },
        toRecipients,
        attachments: graphAttachments,
      },
      saveToSentItems: true,
    };

    const response = await axios.post(url, message, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 202) {
      console.log('📨 Correo enviado con éxito.');
      return true;
    } else {
      console.error('❌ Error al enviar correo:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error en sendMail:', error);
    throw error;
  }
}
