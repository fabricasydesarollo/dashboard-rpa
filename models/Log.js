import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/database.js';

export class Log extends Model {}

Log.init({
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  bot_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'bots',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('exito', 'proceso', 'error'),
    allowNull: false,
    defaultValue: 'proceso'
  },
  fecha_log: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Log',
  tableName: 'logs',
  timestamps: true
});
