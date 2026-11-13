import { executeGlosasProcedure } from '../db/glosas_db.js'

export async function getEncabezadoGlosasFidu () {
  try {
    const resultado = await executeGlosasProcedure('Odo_SP_Glosas_Fidu_ArCuEnGlo_Tablero_Select')
    return resultado.recordset || []
  } catch (error) {
    console.error('Error en getEncabezadoGlosasFidu:', error.message)
    throw new Error('Error al obtener encabezado de glosas: ' + error.message)
  }
}

export async function getDetalladoGlosasFidu (params = {}) {
  try {
    const resultado = await executeGlosasProcedure('Odo_SP_Glosas_Fidu_ArCuDetGlo_Tablero_Select', params)
    return resultado.recordset || []
  } catch (error) {
    console.error('Error en getDetalladoGlosasFidu:', error.message)
    throw new Error('Error al obtener detallado de glosas: ' + error.message)
  }
}
