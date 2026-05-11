import { Sequelize } from 'sequelize';
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const mssqlConfig = {
  server: process.env.DB_HOSTNAME_GO,
  port: parseInt(process.env.MSSQL_PORT || '1433'),
  user: process.env.DB_USERNAME_GO,
  password: process.env.DB_PASSWORD_GO,
  database: process.env.DB_DATABASE_GO,
  authentication: {
    type: 'default'
  },
  options: {
    trustServerCertificate: true,
    enableKeepAlive: true,
  }
};

export const pool = new sql.ConnectionPool(mssqlConfig);

// Conectar el pool
export const connectPool = async () => {
  try {
    await pool.connect();
    console.log('✅ Conexión a SQL Server exitosa (mssql)');
  } catch (error) {
    console.error('❌ Error conectando a SQL Server:', error.message);
  }
};

// Ejecutar query directa con mssql
export const executeQuery = async (query) => {
  try {
    if (pool.connected === false) {
      await pool.connect();
    }
    const request = pool.request();
    
    const result = await request.query(query);
    return result;
  } catch (error) {
    console.error('Error ejecutando query:', error.message);
    throw error;
  }
};

export const goConection = async () => {
  // Usa la opción que prefieras
  await connectPool();
}