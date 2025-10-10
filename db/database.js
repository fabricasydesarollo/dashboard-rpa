import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,	
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false, // desactiva logs de SQL
    timezone: '-05:00', // Fuerza zona horaria de Colombia (UTC-5)
  }
);

// Probar conexión
export const testConnection = async () => {
  try {
    await sequelize.authenticate();  
    console.log('✅ Conexión a la base de datos exitosa');
    console.log(process.env.DB_DATABASE);
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
};
