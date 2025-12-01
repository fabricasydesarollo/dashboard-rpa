import { Op } from 'sequelize'
import { TrazabilidadEnvio } from '../../models/TrazabilidadEnvio.js'

const botHistoriasClinicasId = 7

export const getEnviosHistoriasClinicas = async () => {

  // ==== FECHAS ====
  const hoy = new Date()
  const añoActual = hoy.getFullYear()

  // Primer día del año
  const inicioAño = new Date(añoActual, 0, 1)

  // Fin del año
  const finAño = new Date(añoActual, 11, 31, 23, 59, 59)

  // ==== Obtener toda la trazabilidad del año ====
  const registros = await TrazabilidadEnvio.findAll({
    where: {
      bot_id: botHistoriasClinicasId,
      updatedAt: { [Op.between]: [inicioAño, finAño] }
    },
    attributes: ['id', 'updatedAt']
  })

  // ==== Agrupación semanal y mensual ====
  const semanasMap = {}
  const mesesMap = {}

  registros.forEach(r => {
    const fecha = new Date(r.updatedAt)

    // SEMANA DEL MES (NUEVA LÓGICA)
    const diaMes = fecha.getDate() // 1–31
    const semanaMes = Math.ceil(diaMes / 7) // 1–5

    const mes = fecha.getMonth() // 0–11
    const claveSemana = `${mes + 1}-${semanaMes}` // ej: "10-3" = Octubre Semana 3

    if (!semanasMap[claveSemana]) semanasMap[claveSemana] = 0
    semanasMap[claveSemana]++

    // MES
    if (!mesesMap[mes]) mesesMap[mes] = 0
    mesesMap[mes]++
  })

  // Formato de salida semanal
  const semanas = Object.keys(semanasMap).map(clave => {
    const [mes, semana] = clave.split('-')

    return {
      label: `Sem ${semana} (${obtenerNombreMes(mes - 1)})`,
      valor: semanasMap[clave]
    }
  })

  // Formato de salida mensual
  const meses = Object.keys(mesesMap).map(mes => ({
    label: obtenerNombreMes(mes),
    valor: mesesMap[mes]
  }))

  return {
    semanal: semanas,
    mensual: meses
  }
}
// ========== Helper de meses ==========
function obtenerNombreMes(idx) {
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
  return meses[idx]
}
