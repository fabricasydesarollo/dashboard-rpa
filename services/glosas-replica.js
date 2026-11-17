import { Op } from 'sequelize'
import { sequelize } from '../db/database.js'
import { ArCuGlosas } from '../models/ArCuGlosas.js'
import { ArCuGlosasDet } from '../models/ArCuGlosasDet.js'

export const ENC_KEYS = ['ArCuEmp', 'ArCuPref', 'ArCuFac']
export const DET_KEYS = ['ArCuEmp', 'ArCuPref', 'ArCuFac', 'ArCuIdGlosa', 'ArCuItem']

const NO_UPDATE = new Set(['ArCuSed', 'UsuAdd', 'FecAdd'])
const colsUpdate = (Model, keys) =>
  Object.keys(Model.rawAttributes).filter(k => !NO_UPDATE.has(k) && !keys.includes(k))

const ENC_UPDATE_COLS = colsUpdate(ArCuGlosas, ENC_KEYS)
const DET_UPDATE_COLS = colsUpdate(ArCuGlosasDet, DET_KEYS)

const badRequest = (msg) => Object.assign(new Error(msg), { status: 400 })

function parseFecha(val, col, idx) {
  if (val instanceof Date) {
    if (Number.isNaN(val.getTime())) throw badRequest(`Fecha inválida en ${col} (fila ${idx})`)
    return val
  }
  let s = String(val).trim().replace(' ', 'T')
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s += 'T00:00:00-05:00'
  else if (!/[Zz]|[+-]\d{2}:?\d{2}$/.test(s)) s += '-05:00'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) throw badRequest(`Fecha inválida en ${col} (fila ${idx})`)
  return d
}

export function normalizarFila(fila, Model, llaves = [], idx = 0) {
  if (!fila || typeof fila !== 'object' || Array.isArray(fila)) {
    throw badRequest(`Fila ${idx} inválida`)
  }
  const out = {}
  for (const [col, attr] of Object.entries(Model.rawAttributes)) {
    if (col === 'ArCuSed') {
      out.ArCuSed = null
      continue
    }
    const raw = fila[col]
    const str = typeof raw === 'string' ? raw.trim() : raw

    if (str === undefined || str === null || str === '') {
      if (col === 'FecAdd') out[col] = new Date()
      else if (col === 'UsuAdd') out[col] = String(fila.UsuMod ?? '').trim() || 'REPLICA'
      else if (attr.defaultValue !== undefined && typeof attr.defaultValue !== 'object') out[col] = attr.defaultValue
      else out[col] = null

      if (llaves.includes(col) && (out[col] === null || out[col] === '')) {
        throw badRequest(`Llave requerida vacía: ${col} (fila ${idx})`)
      }
      continue
    }

    const tipo = attr.type.key
    if (tipo === 'STRING' || tipo === 'TEXT') {
      out[col] = String(str).trim()
    } else if (tipo.startsWith('DOUBLE') || tipo === 'SMALLINT') {
      const n = typeof raw === 'boolean' ? NaN : Number(str)
      if (!Number.isFinite(n) || (tipo === 'SMALLINT' && !Number.isInteger(n))) {
        throw badRequest(`Número inválido en ${col} (fila ${idx})`)
      }
      if (col === 'ArCuItem' && n < 1) throw badRequest(`ArCuItem inválido en fila ${idx}`)
      out[col] = n
    } else if (tipo === 'DATE') {
      out[col] = parseFecha(str, col, idx)
    }
  }
  return out
}

const claveFactura = (r) => `${r.ArCuEmp}|${r.ArCuPref}|${r.ArCuFac}`

export async function replicarGlosas(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw badRequest('Payload inválido')
  }
  const { encabezados = [], detalles = [] } = payload
  if (!Array.isArray(encabezados) || !Array.isArray(detalles)) {
    throw badRequest('encabezados y detalles deben ser arreglos')
  }
  if (encabezados.length === 0 && detalles.length === 0) {
    throw badRequest('El lote debe contener al menos un encabezado o detalle')
  }

  const enc = encabezados.map((f, i) => normalizarFila(f, ArCuGlosas, ENC_KEYS, i))
  const det = detalles.map((f, i) => normalizarFila(f, ArCuGlosasDet, DET_KEYS, i))

  const transaction = await sequelize.transaction()
  try {
    if (enc.length > 0) {
      await ArCuGlosas.bulkCreate(enc, { updateOnDuplicate: ENC_UPDATE_COLS, transaction })
    }

    if (det.length > 0) {
      const encSet = new Set(enc.map(claveFactura))
      const faltantes = new Map()
      for (const d of det) {
        const k = claveFactura(d)
        if (!encSet.has(k)) faltantes.set(k, { ArCuEmp: d.ArCuEmp, ArCuPref: d.ArCuPref, ArCuFac: d.ArCuFac })
      }
      if (faltantes.size > 0) {
        const existentes = await ArCuGlosas.findAll({
          attributes: ENC_KEYS,
          where: { [Op.or]: [...faltantes.values()] },
          raw: true,
          transaction
        })
        const existSet = new Set(existentes.map(claveFactura))
        const huerfana = [...faltantes.keys()].find(k => !existSet.has(k))
        if (huerfana) throw badRequest(`Detalle sin encabezado en ArCuGlosas para factura ${huerfana}`)
      }

      await ArCuGlosasDet.bulkCreate(det, { updateOnDuplicate: DET_UPDATE_COLS, transaction })
    }

    await transaction.commit()
    return { encabezados: enc.length, detalles: det.length }
  } catch (err) {
    if (transaction && !transaction.finished) await transaction.rollback()
    throw err
  }
}
