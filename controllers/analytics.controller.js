import { getBotsStats, getProcesosHoy, getProcesosAyer, 
  calculateTrendProcesosHoy, getTasasHoy, getRegistrosPorBotHoy, 
  getProcesadosPorMaquina, getEnviosHistoriasClinicas } from '../services/analytics/index.js'

export const AnalyticsController = {
  async getKpis(req, res) {
    try {
      const { totalBots, botsActivos, botsInactivos } = await getBotsStats()

      const { RegistrosHoy, TrazabilidadesHoy, AutorizacionesHoy } = await getProcesosHoy()
      const { RegistrosAyer, TrazabilidadesAyer, AutorizacionesAyer } = await getProcesosAyer()

      const procesosHoy = { registros: RegistrosHoy, trazabilidades: TrazabilidadesHoy, autorizaciones: AutorizacionesHoy }
      const tasasHoy = await getTasasHoy()

      const trends = {
        registros: calculateTrendProcesosHoy(RegistrosHoy, RegistrosAyer),
        trazabilidades: calculateTrendProcesosHoy(TrazabilidadesHoy, TrazabilidadesAyer),
        autorizaciones: calculateTrendProcesosHoy(AutorizacionesHoy, AutorizacionesAyer)
      }

      return res.json({ totalBots, botsActivos, botsInactivos, procesosHoy, trends, tasasHoy })
    } catch (err) {
      console.error('Error en AnalyticsController.getKpis:', err)
      return res.status(500).json({ error: 'Error al obtener las KPIs' })
    }
  },

  async getRegistrosPorBotHoy(req, res) {
    try {
      const resultados = await getRegistrosPorBotHoy()
      return res.json(resultados)
    } catch (err) {
      console.error('Error en AnalyticsController.getRegistrosPorBotHoy:', err)
      return res.status(500).json({ error: 'Error al obtener los registros por bot de hoy' })
    }
  },
  async getProcesadosPorMaquina(req, res) {
    try {
      const resultados = await getProcesadosPorMaquina()
      return res.json(resultados)
    } catch (err) {
      console.error('Error en AnalyticsController.getProcesadosPorMaquina:', err)
      return res.status(500).json({ error: 'Error al obtener los procesados por máquina' })
    }
  },

   async getEnviosHistoriasClinicas(req, res) {
    try {
      const data = await getEnviosHistoriasClinicas()
      return res.json(data)
    } catch (err) {
      console.error("Error en AnalyticsController.getEnviosHistoriasClinicas:", err)
      return res.status(500).json({ error: 'Error al obtener los envíos de historias clínicas' })
    }
  }
}
