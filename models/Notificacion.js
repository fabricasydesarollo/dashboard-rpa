// models/Notificacion.js
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/database.js';

export class Notificacion extends Model {}

Notificacion.init({
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('info', 'advertencia', 'error', 'exito'),
    defaultValue: 'info'
  },
  leido: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  sequelize,
  modelName: 'Notificacion',
  tableName: 'notificaciones',
  timestamps: true // usa createdAt y updatedAt
});
