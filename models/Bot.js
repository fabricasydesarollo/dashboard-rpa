import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/database.js';

export class Bot extends Model {}

Bot.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('ejecucion', 'pausado','activo','error'),
    allowNull: false,
    defaultValue: 'ejecucion'
  },
  total_registros: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  procesados: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  sequelize,
  modelName: 'Bot',
  tableName: 'bots',
  timestamps: true 
});
