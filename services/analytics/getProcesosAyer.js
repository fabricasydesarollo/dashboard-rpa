import { Registro } from '../../models/Registro.js'
import { TrazabilidadEnvio } from '../../models/TrazabilidadEnvio.js'
import { AutorizacionBot } from '../../models/AutorizacionBot.js'
import { RegistroGeneral } from '../../models/RegistroGeneral.js'
import { Op } from 'sequelize'
import { NotaCreditoMasiva } from '../../models/NotaCreditoMasiva.js'

export async function getProcesosAyer() {
  const estadosProcesados = ['exito', 'error']

  const inicioAyer = new Date()
  inicioAyer.setHours(0, 0, 0, 0)
  inicioAyer.setDate(inicioAyer.getDate() - 1)

  const finAyer = new Date()
  finAyer.setHours(23, 59, 59, 999)
  finAyer.setDate(finAyer.getDate() - 1)

  const [r1, r2, h, a, nca] = await Promise.all([
    Registro.count({
      where: {
        estado: { [Op.in]: estadosProcesados },
        updatedAt: { [Op.between]: [inicioAyer, finAyer] }
      }
    }),

    RegistroGeneral.count({
      where: {
        estado: { [Op.in]: estadosProcesados },
        updatedAt: { [Op.between]: [inicioAyer, finAyer] }
      }
    }),

    TrazabilidadEnvio.count({
      where: {
        estado_envio: { [Op.in]: estadosProcesados },
        updatedAt: { [Op.between]: [inicioAyer, finAyer] }
      }
    }),

    AutorizacionBot.count({
      where: {
        estado: { [Op.in]: estadosProcesados },
        updatedAt: { [Op.between]: [inicioAyer, finAyer] }
      }
    }),
    NotaCreditoMasiva.count({
      where: {
        estado: { [Op.in]: estadosProcesados },
        updatedAt: { [Op.between]: [inicioAyer, finAyer] }
      }
    }),
  ])

  return {RegistrosAyer: r1 + r2, TrazabilidadesAyer: h, AutorizacionesAyer: a, NotasCreditoAyer: nca ? nca : 0}
}
