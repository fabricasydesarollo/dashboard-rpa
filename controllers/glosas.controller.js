import { getEncabezadoGlosasFidu, getDetalladoGlosasFidu } from '../models/glosas_fidu.js'

const getParam = (query, ...keys) => {
  for (const k of keys) {
    if (query[k] !== undefined && query[k] !== null) {
      return String(query[k])
    }
  }
  return ''
}

export const GlosasController = {
  async getEncabezadoGlosasFidu (req, res) {
    try {
      const data = await getEncabezadoGlosasFidu()
      return res.status(200).json({ status: 'success', data })
    } catch (err) {
      console.error('Error en getEncabezadoGlosasFidu:', err)
      return res.status(500).json({ error: err.message || 'Error al obtener encabezado de glosas' })
    }
  },

  async getDetalladoGlosasFidu (req, res) {
    try {
      const q = req.query || {}
      const params = {
        CodEmp: getParam(q, 'CodEmp', 'codEmp', 'cod_emp'),
        NomEmp: getParam(q, 'NomEmp', 'nomEmp', 'nom_emp'),
        CodFact: getParam(q, 'CodFact', 'codFact', 'cod_fact'),
        CodCups: getParam(q, 'CodCups', 'codCups', 'cod_cups'),
        CodAseg: getParam(q, 'CodAseg', 'codAseg', 'cod_aseg'),
        ValFac: getParam(q, 'ValFac', 'valFac', 'val_fac'),
        CodEst: getParam(q, 'CodEst', 'codEst', 'cod_est'),
        NomEst: getParam(q, 'NomEst', 'nomEst', 'nom_est'),
        ResServ: getParam(q, 'ResServ', 'resServ', 'res_serv')
      }

      const data = await getDetalladoGlosasFidu(params)
      return res.status(200).json({ status: 'success', data })
    } catch (err) {
      console.error('Error en getDetalladoGlosasFidu:', err)
      return res.status(500).json({ error: err.message || 'Error al obtener detallado de glosas' })
    }
  }
}
