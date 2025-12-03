import { Op, fn, col } from 'sequelize'
import { Registro } from '../../models/Registro.js'
import { TrazabilidadEnvio } from '../../models/TrazabilidadEnvio.js'
import { AutorizacionBot } from '../../models/AutorizacionBot.js'
import { RegistroGeneral } from '../../models/RegistroGeneral.js'
import { NotaCreditoMasiva } from '../../models/NotaCreditoMasiva.js'

export const getDistribucionEstados = async (bot_id) => {

  // ==== FECHAS ====
  const hoy = new Date()
  const añoActual = hoy.getFullYear()

  const inicioAño = new Date(añoActual, 0, 1)
  const finAño   = new Date(añoActual, 11, 31, 23, 59, 59)

  // ==== CONFIGURACIÓN DINÁMICA ====
  const botsRetiroUsuarios = [1, 2, 3]
  const botHistoriasClinicasId = 7
  const botNotasCreditoAvidanti = 4
  const botAutorizacionesId = 10

  let modelo = Registro
  let campoEstado = "estado"

  if (botsRetiroUsuarios.includes(Number(bot_id))) {
    modelo = Registro
    campoEstado = "estado"

  } else if (Number(bot_id) === botHistoriasClinicasId) {
    modelo = TrazabilidadEnvio
    campoEstado = "estado_envio"

  } else if (Number(bot_id) === botAutorizacionesId) {
    modelo = AutorizacionBot
    campoEstado = "estado"

  } else if (Number(bot_id) === botNotasCreditoAvidanti) {
    modelo = NotaCreditoMasiva
    campoEstado = "estado"
  } else {
    modelo = RegistroGeneral
    campoEstado = "estado"
  }

  // ==== QUERY USANDO GROUP + COUNT ====
  const resultados = await modelo.findAll({
    where: {
      bot_id,
      [campoEstado]: { [Op.ne]: null },
      updatedAt: { [Op.between]: [inicioAño, finAño] }
    },
    attributes: [
      [fn('LOWER', col(campoEstado)), 'estado'],
      [fn('COUNT', col(campoEstado)), 'cantidad']
    ],
    group: [fn('LOWER', col(campoEstado))]
  })

  // ==== TRANSFORMAR AL FORMATO ESPERADO ====

  let exito = 0
  let error = 0
  let pendiente = 0

  resultados.forEach(row => {
    const estado = row.dataValues.estado
    const cantidad = Number(row.dataValues.cantidad)

    if (["exito", "success", "ok"].includes(estado)) exito += cantidad
    else if (["error", "fallo", "failed"].includes(estado)) error += cantidad
    else pendiente += cantidad
  })

  return { exito, error, pendiente }
}
