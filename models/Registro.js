import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/database.js';

export class Registro extends Model {}

Registro.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bot_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'bots',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  solicitud_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'solicitudes_usuario',
      key: 'id'
    },
    onDelete: 'CASCADE' // o CASCADE según tu lógica
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
    defaultValue: DataTypes.NOW
  },
  duracion: {
    type: DataTypes.FLOAT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Registro',
  tableName: 'registros',
  timestamps: true
});
