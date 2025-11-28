import { Registro } from '../../models/Registro.js'
import { TrazabilidadEnvio } from '../../models/TrazabilidadEnvio.js'
import { AutorizacionBot } from '../../models/AutorizacionBot.js'
import { RegistroGeneral } from '../../models/RegistroGeneral.js'
import { Op } from 'sequelize'

export async function getProcesosHoy() {
  const estadosProcesados = ['exito', 'error']

  const inicioDia = new Date()
  inicioDia.setHours(0, 0, 0, 0)

  const finDia = new Date()
  finDia.setHours(23, 59, 59, 999)

  const [r1, r2, h, a] = await Promise.all([
    Registro.count({
      where: {
        estado: { [Op.in]: estadosProcesados },
        updatedAt: { [Op.between]: [inicioDia, finDia] }
      }
    }),

    RegistroGeneral.count({
      where: {
        estado: { [Op.in]: estadosProcesados },
        updatedAt: { [Op.between]: [inicioDia, finDia] }
      }
    }),

    TrazabilidadEnvio.count({
      where: {
        estado_envio: { [Op.in]: estadosProcesados },
        updatedAt: { [Op.between]: [inicioDia, finDia] }
      }
    }),

    AutorizacionBot.count({
      where: {
        estado: { [Op.in]: estadosProcesados },
        updatedAt: { [Op.between]: [inicioDia, finDia] }
      }
    }),
  ])

  return {RegistrosHoy: r1 + r2, TrazabilidadesHoy: h ? h : 0, AutorizacionesHoy: a ? a : 0}
}
