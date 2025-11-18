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
  maquina_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('exito', 'proceso', 'error','pendiente'),
    allowNull: false,
    defaultValue: 'pendiente'
  },
  fecha_log: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  duracion: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: '00:00:00'
  }
}, {
  sequelize,
  modelName: 'Log',
  tableName: 'logs',
  timestamps: true
});
