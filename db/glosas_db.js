import sql from 'mssql'
import dotenv from 'dotenv'

dotenv.config()

const mssqlConfig = {
  server: process.env.DB_HOSTNAME_GLOSAS,
  port: parseInt(process.env.MSSQL_PORT_GLOSAS || '1433'),
  user: process.env.DB_USERNAME_GLOSAS,
  password: process.env.DB_PASSWORD_GLOSAS,
  database: process.env.DB_DATABASE_GLOSAS,
  authentication: {
    type: 'default'
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
  }
}

export const pool = new sql.ConnectionPool(mssqlConfig)

export const connectGlosasPool = async () => {
  if (!process.env.DB_HOSTNAME_GLOSAS) {
    console.warn('⚠️ Variables de conexión para SQL Server Glosas no configuradas (DB_HOSTNAME_GLOSAS)')
    return
  }
  try {
    await pool.connect()
    console.log('✅ Conexión a SQL Server Glosas exitosa (mssql)')
  } catch (error) {
    console.error('❌ Error conectando a SQL Server Glosas:', error.message)
  }
}

export const executeGlosasProcedure = async (procedureName, params = {}) => {
  try {
    if (!process.env.DB_HOSTNAME_GLOSAS) {
      throw new Error('Configuración de base de datos de Glosas no encontrada en variables de entorno')
    }
    if (pool.connected === false) {
      await pool.connect()
    }
    const request = pool.request()
    for (const [key, value] of Object.entries(params)) {
      request.input(key, sql.VarChar, String(value ?? ''))
    }
    const result = await request.execute(procedureName)
    return result
  } catch (error) {
    console.error(`Error ejecutando SP ${procedureName}:`, error.message)
    throw error
  }
}

export const executeGlosasQuery = async (query) => {
  try {
    if (!process.env.DB_HOSTNAME_GLOSAS) {
      throw new Error('Configuración de base de datos de Glosas no encontrada en variables de entorno')
    }
    if (pool.connected === false) {
      await pool.connect()
    }
    const request = pool.request()
    const result = await request.query(query)
    return result
  } catch (error) {
    console.error('Error ejecutando query glosas:', error.message)
    throw error
  }
}
