import { Op } from 'sequelize'
import { Registro } from '../../models/Registro.js'
import { TrazabilidadEnvio } from '../../models/TrazabilidadEnvio.js'
import { AutorizacionBot } from '../../models/AutorizacionBot.js'
import { RegistroGeneral } from '../../models/RegistroGeneral.js'

// Helper
function obtenerNombreMes(idx) {
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
  return meses[idx]
}

export const getTiemposEjecucion = async (modo, bot_id, maquina_id) => {

  // ==== FECHAS ====
  const hoy = new Date()
  const añoActual = hoy.getFullYear()

  const inicioAño = new Date(añoActual, 0, 1)
  const finAño = new Date(añoActual, 11, 31, 23, 59, 59)

  // ==== Configuración dinámica por bot ====
  const botsRetiroUsuarios = [1, 2, 3]
  const botHistoriasClinicasId = 7
  const botAutorizacionesId = 10

  // Defaults
  let modelo = Registro
  let campoDuracion = 'duracion'
  let filtro = {}

  if (bot_id) filtro.bot_id = bot_id
  if (maquina_id) filtro.maquina_id = maquina_id

  if (botsRetiroUsuarios.includes(Number(bot_id))) {
    modelo = Registro
    campoDuracion = 'duracion'

  } else if (Number(bot_id) === botHistoriasClinicasId) {
    modelo = TrazabilidadEnvio
    campoDuracion = 'duracion'

  } else if (Number(bot_id) === botAutorizacionesId) {
    modelo = AutorizacionBot
    campoDuracion = 'duracion'

  } else {
    modelo = RegistroGeneral
    campoDuracion = 'duracion'
  }

  // ==== Query dinámica ====
  const registros = await modelo.findAll({
    where: {
      ...filtro,
      [campoDuracion]: { [Op.ne]: null },
      updatedAt: { [Op.between]: [inicioAño, finAño] }
    },
    attributes: [campoDuracion, 'createdAt']
  })

  // ==== Mapas de agregación ====
  const semanasMap = {}
  const mesesMap = {}

  registros.forEach(r => {
    const fecha = new Date(r.createdAt)
    const duracion = Number(r[campoDuracion]) || 0

    // ---- SEMANAL ----
    const diaMes = fecha.getDate()
    const semanaMes = Math.ceil(diaMes / 7)
    const mes = fecha.getMonth()

    const claveSemana = `${mes + 1}-${semanaMes}`

    if (!semanasMap[claveSemana]) semanasMap[claveSemana] = []
    semanasMap[claveSemana].push(duracion)

    // ---- MENSUAL ----
    if (!mesesMap[mes]) mesesMap[mes] = []
    mesesMap[mes].push(duracion)
  })

  // ==== Formato semanal ====
  const semanal = Object.keys(semanasMap).map(clave => {
    const [mes, semana] = clave.split('-')
    const valores = semanasMap[clave]

    const promedio = valores.reduce((a, b) => a + b, 0) / valores.length

    return {
      label: `Sem ${semana} (${obtenerNombreMes(mes - 1)})`,
      valor: Number(promedio.toFixed(2))
    }
  })

  // ==== Formato mensual ====
  const mensual = Object.keys(mesesMap).map(mes => {
    const valores = mesesMap[mes]
    const promedio = valores.reduce((a, b) => a + b, 0) / valores.length

    return {
      label: obtenerNombreMes(Number(mes)),
      valor: Number(promedio.toFixed(2))
    }
  })

  // ==== RESPUESTA SEGÚN MODO ====
  if (modo === "semanal") {
    return { semanal }
  }

  if (modo === "mensual") {
    return { mensual }
  }

  // modo = all o inválido → devolver ambos
  return { semanal, mensual }
}
