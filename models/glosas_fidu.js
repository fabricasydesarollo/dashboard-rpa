import { QueryTypes } from 'sequelize'
import { sequelize } from '../db/database.js'

export const DEFAULT_COD_EMP = '203'

const toTrimmedStr = (val) => {
  if (val === null || val === undefined) return null
  const s = String(val).trim()
  return s === '' ? null : s
}

export function normalizarEmpresaGlosa (row = {}) {
  return {
    CodEmp: toTrimmedStr(row.CodEmp),
    NomEmp: toTrimmedStr(row.NomEmp),
    NitEmp: toTrimmedStr(row.NitEmp),
    Siglas: toTrimmedStr(row.Siglas ?? row.Org)
  }
}

export async function getEmpresasGlosasFidu () {
  try {
    const filas = await sequelize.query(
      `SELECT
        ace.CodEmp AS CodEmp,
        ace.NomEmp AS NomEmp,
        ace.NitEmp AS NitEmp,
        ace.Org AS Siglas
      FROM ArCuEmp ace
      ORDER BY ace.CodEmp ASC`,
      { type: QueryTypes.SELECT }
    )
    return Array.isArray(filas) ? filas.map(normalizarEmpresaGlosa) : []
  } catch (error) {
    console.error('Error en getEmpresasGlosasFidu:', error.message)
    throw new Error('Error al obtener empresas de glosas: ' + error.message)
  }
}

export async function getEncabezadoGlosasFidu ({ fechaInicial = '', fechaFinal = '', codEmp = DEFAULT_COD_EMP } = {}) {
  try {
    const pCodEmp = String(codEmp ?? '').trim() || DEFAULT_COD_EMP
    const resultado = await sequelize.query(
      'CALL Odo_SP_Glosas_Fidu_ArCuEnGlo_Tablero_Select(:p_fechaInicial, :p_fechaFinal, :p_codEmp)',
      {
        replacements: {
          p_fechaInicial: String(fechaInicial ?? ''),
          p_fechaFinal: String(fechaFinal ?? ''),
          p_codEmp: pCodEmp
        }
      }
    )
    return Array.isArray(resultado?.[0]) ? resultado[0] : (Array.isArray(resultado) ? resultado : [])
  } catch (error) {
    console.error('Error en getEncabezadoGlosasFidu:', error.message)
    throw new Error('Error al obtener encabezado de glosas: ' + error.message)
  }
}

const toStr = (val) => {
  if (val === null || val === undefined) return null
  const s = String(val)
  return s.trim() === '' ? null : s
}

const toNum = (val) => {
  if (val === null || val === undefined || val === '') return null
  const n = Number(val)
  return Number.isFinite(n) ? n : null
}

const toDate = (val) => {
  if (val === null || val === undefined || val === '') return null
  if (val instanceof Date) return Number.isNaN(val.getTime()) ? null : val.toISOString()
  const s = String(val).trim()
  return s || null
}

export function normalizarDetalleGlosaFidu (row = {}) {
  return {
    ...row,
    NomEmp: toStr(row.NomEmp),
    CodEmp: toStr(row.CodEmp),
    CodFac: toStr(row.CodFac),
    CodPref: toStr(row.CodPref),
    ValFac: toNum(row.ValFac),
    CodCups: toStr(row.CodCups),
    IdGlo: toStr(row.IdGlo),
    ValGlo: toNum(row.ValGlo),
    CodEstGlo: toStr(row.CodEstGlo),
    NomEstGlo: toStr(row.NomEstGlo),
    ObsGlo: toStr(row.ObsGlo),
    ObsResIps: toStr(row.ObsResIps),
    ObsResIps2: toStr(row.ObsResIps2),
    ObsRat: toStr(row.ObsRat),
    ObsRat2: toStr(row.ObsRat2),
    ObsResServ: toStr(row.ObsResServ),
    CodReso: toStr(row.CodReso),
    CodReso2: toStr(row.CodReso2),
    CodReso3: toStr(row.CodReso3),
    FecGlo: toDate(row.FecGlo),
    FecRat: toDate(row.FecRat),
    FecEstFin: toDate(row.FecEstFin),
    CodRes: toStr(row.CodRes),
    FecRes: toDate(row.FecRes),
    CodRes2: toStr(row.CodRes2),
    FecRes2: toDate(row.FecRes2),
    CodRes3: toStr(row.CodRes3),
    FecRes3: toDate(row.FecRes3),
    CodResSecu: toStr(row.CodResSecu),
    FecResSecu: toDate(row.FecResSecu),
    CodResSecu2: toStr(row.CodResSecu2),
    FecResSecu2: toDate(row.FecResSecu2),
    CodResSecu3: toStr(row.CodResSecu3),
    FecResSecu3: toDate(row.FecResSecu3)
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
    const filas = Array.isArray(resultado?.[0]) ? resultado[0] : (Array.isArray(resultado) ? resultado : [])
    return filas.map(normalizarDetalleGlosaFidu)
  } catch (error) {
    console.error('Error en getDetalladoGlosasFidu:', error.message)
    throw new Error('Error al obtener detallado de glosas: ' + error.message)
  }
}

export async function getDetalladoGlosasFiduPorRango ({ fechaInicial = '', fechaFinal = '', codEmp = DEFAULT_COD_EMP } = {}) {
  try {
    const pCodEmp = String(codEmp ?? '').trim() || DEFAULT_COD_EMP
    const resultado = await sequelize.query(
      'CALL Odo_SP_Glosas_Fidu_ArCuDetGlo_Exportar_Select(:p_fechaInicial, :p_fechaFinal, :p_codEmp)',
      {
        replacements: {
          p_fechaInicial: String(fechaInicial ?? ''),
          p_fechaFinal: String(fechaFinal ?? ''),
          p_codEmp: pCodEmp
        }
      }
    )
    const filas = Array.isArray(resultado?.[0]) ? resultado[0] : (Array.isArray(resultado) ? resultado : [])
    return filas.map(normalizarDetalleGlosaFidu)
  } catch (error) {
    console.error('Error en getDetalladoGlosasFiduPorRango:', error.message)
    throw new Error('Error al obtener detallado de glosas por rango: ' + error.message)
  }
}

export async function getExportacionGlosasFidu ({ fechaInicial = '', fechaFinal = '', codEmp = DEFAULT_COD_EMP } = {}) {
  const [encabezados, detalles] = await Promise.all([
    getEncabezadoGlosasFidu({ fechaInicial, fechaFinal, codEmp }),
    getDetalladoGlosasFiduPorRango({ fechaInicial, fechaFinal, codEmp })
  ])
  return { encabezados, detalles }
}
