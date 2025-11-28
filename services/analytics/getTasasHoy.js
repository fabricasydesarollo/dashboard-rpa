import { Registro } from '../../models/Registro.js'
import { RegistroGeneral } from '../../models/RegistroGeneral.js'
import { TrazabilidadEnvio } from '../../models/TrazabilidadEnvio.js'
import { AutorizacionBot } from '../../models/AutorizacionBot.js'
import { Op } from 'sequelize'

export async function getTasasHoy() {

  const inicioDia = new Date()
  inicioDia.setHours(0, 0, 0, 0)

  const finDia = new Date()
  finDia.setHours(23, 59, 59, 999)

  // Estados estándar
  const estadosProcesados = ['exito', 'error']

  const [
    // TOTAL
    r1, r2, r3, r4,

    // ÉXITO
    r1_exito, r2_exito, r3_exito, r4_exito,

    // ERROR
    r1_error, r2_error, r3_error, r4_error
  ] = await Promise.all([

    // TOTAL
    Registro.count({
      where: { estado: { [Op.in]: estadosProcesados }, updatedAt: { [Op.between]: [inicioDia, finDia] } }
    }),
    RegistroGeneral.count({
      where: { estado: { [Op.in]: estadosProcesados }, updatedAt: { [Op.between]: [inicioDia, finDia] } }
    }),
    TrazabilidadEnvio.count({
      where: { estado_envio: { [Op.in]: estadosProcesados }, updatedAt: { [Op.between]: [inicioDia, finDia] } }
    }),
    AutorizacionBot.count({
      where: { estado: { [Op.in]: estadosProcesados }, updatedAt: { [Op.between]: [inicioDia, finDia] } }
    }),

    // ÉXITOS
    Registro.count({
      where: { estado: 'exito', updatedAt: { [Op.between]: [inicioDia, finDia] } }
    }),
    RegistroGeneral.count({
      where: { estado: 'exito', updatedAt: { [Op.between]: [inicioDia, finDia] } }
    }),
    TrazabilidadEnvio.count({
      where: { estado_envio: 'exito', updatedAt: { [Op.between]: [inicioDia, finDia] } }
    }),
    AutorizacionBot.count({
      where: { estado: 'exito', updatedAt: { [Op.between]: [inicioDia, finDia] } }
    }),

    // ERRORES
    Registro.count({
      where: { estado: 'error', updatedAt: { [Op.between]: [inicioDia, finDia] } }
    }),
    RegistroGeneral.count({
      where: { estado: 'error', updatedAt: { [Op.between]: [inicioDia, finDia] } }
    }),
    TrazabilidadEnvio.count({
      where: { estado_envio: 'error', updatedAt: { [Op.between]: [inicioDia, finDia] } }
    }),
    AutorizacionBot.count({
      where: { estado: 'error', updatedAt: { [Op.between]: [inicioDia, finDia] } }
    }),
  ])

  // SUMATORIAS
  const total = r1 + r2 + r3 + r4
  const totalExito = r1_exito + r2_exito + r3_exito + r4_exito
  const totalError = r1_error + r2_error + r3_error + r4_error

  // Tasa de éxito/error
  const tasaExito = total === 0 ? 0 : (totalExito / total) * 100
  const tasaError = total === 0 ? 0 : (totalError / total) * 100

  return {
    tasaExito: Number(tasaExito.toFixed(2)),
    tasaError: Number(tasaError.toFixed(2)),
  }
}
