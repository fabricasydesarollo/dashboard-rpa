import { getBotsStats, getProcesosHoy, getProcesosAyer, calculateTrendProcesosHoy, getTasasHoy } from '../services/analytics/index.js'

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
        }
      }
