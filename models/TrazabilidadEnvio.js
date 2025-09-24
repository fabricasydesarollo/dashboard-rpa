import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/database.js';

export class TrazabilidadEnvio extends Model {}

TrazabilidadEnvio.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  historia_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'historias_clinicas',
      key: 'id'
    },
    onDelete: 'CASCADE'
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
  estado_envio: {
    type: DataTypes.ENUM('exito', 'error', 'pendiente'),
    allowNull: false
  },
  motivo_fallo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha_envio: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'TrazabilidadEnvio',
  tableName: 'trazabilidad_envios',
  timestamps: true
});
