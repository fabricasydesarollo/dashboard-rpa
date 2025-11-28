import { Bot } from '../../models/Bot.js'
import { Maquina } from '../../models/Maquina.js'
import { Op } from 'sequelize'

export async function getBotsStats() {
  const totalBots = await Bot.count()

  const botsActivos = await Bot.count({
    distinct: true,
    include: [
      {
        model: Maquina,
        where: { estado: { [Op.or]: ['activo', 'ejecucion'] } },
        required: true,
        attributes: []
      }
    ]
  })
  // total Registros hoy se tiene en cuenta tanto los exito como error
  
  return {
    totalBots,
    botsActivos,
    botsInactivos: totalBots - botsActivos
  }
}
