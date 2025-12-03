import { sequelize } from '../../db/database.js';
import { Op } from 'sequelize'
import { Bot } from '../../models/Bot.js'
import { Registro } from '../../models/Registro.js'
import { RegistroGeneral } from '../../models/RegistroGeneral.js'
import { TrazabilidadEnvio } from '../../models/TrazabilidadEnvio.js'
import { AutorizacionBot } from '../../models/AutorizacionBot.js'
import { NotaCreditoMasiva } from '../../models/NotaCreditoMasiva.js';

export const getProcesadosPorMaquina = async () => {
  const inicioDia = new Date()
  inicioDia.setHours(0, 0, 0, 0)

  const finDia = new Date()
  finDia.setHours(23, 59, 59, 999)

  const estadosProcesados = ['exito', 'error']

  const botRetiroUsuarios = [1, 2, 3]
  const botHC = 7
  const botNotasCreditoAvidanti = 4
  const botAutorizaciones = 10

  const bots = await Bot.findAll()
  const resultados = []

  for (const bot of bots) {
    let registros = []

    // --- Seleccionar tabla según tipo de bot ---
    let modelo = Registro
    let campoEstado = 'estado'
    let filtro = { bot_id: bot.id }

    if (botRetiroUsuarios.includes(bot.id)) {
      modelo = Registro
    } else if (bot.id === botHC) {
      modelo = TrazabilidadEnvio
      campoEstado = 'estado_envio'
    } else if (bot.id === botAutorizaciones) {
      modelo = AutorizacionBot
      filtro = {} // no tiene bot_id
    } else if (bot.id === botNotasCreditoAvidanti) {
      modelo = NotaCreditoMasiva
      filtro = {} // no tiene bot_id
    } else {
      modelo = RegistroGeneral
    }

    // --- Query optimizada con GROUP BY ---
    registros = await modelo.findAll({
      where: {
        ...filtro,
        [campoEstado]: { [Op.in]: estadosProcesados },
        updatedAt: { [Op.between]: [inicioDia, finDia] }
      },
      attributes: [
        'maquina_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'procesados']
      ],
      group: ['maquina_id']
    })

    // Convertimos a JSON limpio
    const maquinas = registros.map(r => ({
      id: r.maquina_id,
      procesados: Number(r.dataValues.procesados)
    }))

    resultados.push({
      bot: bot.nombre,
      maquinas
    })
  }

  return (resultados)
}
