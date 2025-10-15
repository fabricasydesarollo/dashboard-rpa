import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/database.js';

export class RegistroGeneral extends Model {}

RegistroGeneral.init({
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
  fecha_ejecucion: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'RegistroGeneral',
  tableName: 'registros_general',
  timestamps: true
});
