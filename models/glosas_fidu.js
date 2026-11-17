import { sequelize } from '../db/database.js'

export async function getEncabezadoGlosasFidu ({ fechaInicial = '', fechaFinal = '' } = {}) {
  try {
    const resultado = await sequelize.query(
      'CALL Odo_SP_Glosas_Fidu_ArCuEnGlo_Tablero_Select(:p_fechaInicial, :p_fechaFinal)',
      {
        replacements: {
          p_fechaInicial: String(fechaInicial ?? ''),
          p_fechaFinal: String(fechaFinal ?? '')
        }
      }
    )
    return Array.isArray(resultado?.[0]) ? resultado[0] : (Array.isArray(resultado) ? resultado : [])
  } catch (error) {
    console.error('Error en getEncabezadoGlosasFidu:', error.message)
    throw new Error('Error al obtener encabezado de glosas: ' + error.message)
  }
}

export async function getDetalladoGlosasFidu ({ CodEmp = '', CodFac = '' } = {}) {
  try {
    const resultado = await sequelize.query(
      'CALL Odo_SP_Glosas_Fidu_ArCuDetGlo_Tablero_Select(:p_CodEmp, :p_CodFac)',
      {
        replacements: {
          p_CodEmp: String(CodEmp ?? ''),
          p_CodFac: String(CodFac ?? '')
        }
      }
    )
    return Array.isArray(resultado?.[0]) ? resultado[0] : (Array.isArray(resultado) ? resultado : [])
  } catch (error) {
    console.error('Error en getDetalladoGlosasFidu:', error.message)
    throw new Error('Error al obtener detallado de glosas: ' + error.message)
  }
}
