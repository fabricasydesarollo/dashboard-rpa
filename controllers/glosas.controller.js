import { getEncabezadoGlosasFidu, getDetalladoGlosasFidu } from '../models/glosas_fidu.js'
import { replicarGlosas } from '../services/glosas-replica.js'

const getParam = (query, ...keys) => {
  for (const k of keys) {
    if (query[k] !== undefined && query[k] !== null) {
      return String(query[k])
    }
  }
  return ''
}

const normalizeDateParam = (val) => {
  const s = String(val ?? '').trim()
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
  }
  return s.replace(/\//g, '-')
}

export const GlosasController = {
  async getEncabezadoGlosasFidu (req, res) {
    try {
      const q = req.query || {}
      const fechaInicial = normalizeDateParam(
        getParam(q, 'fecha_inicio', 'fechaInicial', 'p_fechaInicial')
      )
      const fechaFinal = normalizeDateParam(
        getParam(q, 'fecha_fin', 'fechaFinal', 'p_fechaFinal')
      )

      if (!fechaInicial || !fechaFinal) {
        return res.status(400).json({ message: 'Se requieren fecha_inicio y fecha_fin' })
      }

      const data = await getEncabezadoGlosasFidu({ fechaInicial, fechaFinal })
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
        CodEmp: getParam(q, 'CodEmp', 'codEmp', 'cod_emp', 'p_CodEmp'),
        CodFac: getParam(q, 'CodFac', 'codFac', 'cod_fac', 'CodFact', 'codFact', 'cod_fact', 'p_CodFac')
      }

      const data = await getDetalladoGlosasFidu(params)
      return res.status(200).json({ status: 'success', data })
    } catch (err) {
      console.error('Error en getDetalladoGlosasFidu:', err)
      return res.status(500).json({ error: err.message || 'Error al obtener detallado de glosas' })
    }
  },

  async replicarGlosas (req, res) {
    try {
      const data = await replicarGlosas(req.body)
      return res.status(200).json({ status: 'success', data })
    } catch (err) {
      const status = err.status === 400 ? 400 : 500
      if (status === 500) console.error('Error en replicarGlosas:', err)
      return res.status(status).json({ status: 'error', error: err.message || 'Error al replicar glosas' })
    }
  }
}
