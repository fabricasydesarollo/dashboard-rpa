import { Registro } from '../../models/Registro.js'
import { TrazabilidadEnvio } from '../../models/TrazabilidadEnvio.js'
import { AutorizacionBot } from '../../models/AutorizacionBot.js'
import { RegistroGeneral } from '../../models/RegistroGeneral.js'
import { Bot } from '../../models/Bot.js'
import { Op } from 'sequelize'

function simplificarNombreBot(nombre) {
  const reglas = [
    { contiene: "Historias", reemplazo: "HC" },
    { contiene: "Clinicas", reemplazo: "" },
    { contiene: "Envio", reemplazo: "Envío" },
    { contiene: "Retiro", reemplazo: "Retiro" },
    { contiene: "Usuarios", reemplazo: "" },
    { contiene: "Notas", reemplazo: "Notas" },
    { contiene: "credito", reemplazo: "Crédito" },
    { contiene: "Facturas", reemplazo: "Fact." },
    { contiene: "Autorizaciones", reemplazo: "Autoriz." },
    { contiene: "Soporte", reemplazo: "Soporte" },
    { contiene: "Patologias", reemplazo: "Patologías" },
    { contiene: "Bloqueo", reemplazo: "Bloq." },
    { contiene: "Automaticacion", reemplazo: "Auto." },
    { contiene: "Automatizacion", reemplazo: "Auto." }
  ];

  let resultado = nombre;

  reglas.forEach(regla => {
    if (resultado.includes(regla.contiene)) {
      resultado = resultado.replace(regla.contiene, regla.reemplazo);
    }
  });

  return resultado
    .replace("Bot", "")
    .replace(/\s+/g, " ")
    .trim();
}

export const getRegistrosPorBotHoy = async () => {

  const inicioDia = new Date()
  inicioDia.setHours(0, 0, 0, 0)

  const finDia = new Date()
  finDia.setHours(23, 59, 59, 999)

  const botRetiroUsuarios = [1, 2, 3];
  const botHistoriasClinicasId = 7;
  const botAutorizacionesId = 10;

  const bots = await Bot.findAll()
  let resultados = [];

  for (const bot of bots) {
    let conteo = 0;

    if (botRetiroUsuarios.includes(bot.id)) {
      conteo = await Registro.count({
        where: {
          bot_id: bot.id,
          updatedAt: { [Op.between]: [inicioDia, finDia] }
        }
      });

    } else if (bot.id === botHistoriasClinicasId) {
      conteo = await TrazabilidadEnvio.count({
        where: {
          bot_id: bot.id,
          updatedAt: { [Op.between]: [inicioDia, finDia] }
        }
      });

    } else if (bot.id === botAutorizacionesId) {
      conteo = await AutorizacionBot.count({
        where: {
          updatedAt: { [Op.between]: [inicioDia, finDia] }
        }
      });

    } else {
      conteo = await RegistroGeneral.count({
        where: {
          bot_id: bot.id,
          updatedAt: { [Op.between]: [inicioDia, finDia] }
        }
      });
    }

    resultados.push({
      bot: simplificarNombreBot(bot.nombre),
      registros: conteo
    });
  }

  return resultados;
}
