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
  maquina_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
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
    defaultValue: DataTypes.NOW,
    get() {
      const rawValue = this.getDataValue('fecha_envio');
      if (!rawValue) return null;
      
      // Convierte la fecha UTC a Colombia (UTC-5)
      const date = new Date(rawValue);
      const colombiaOffset = -5 * 60; // -5 horas en minutos
      const localDate = new Date(date.getTime() + (colombiaOffset * 60 * 1000));
      
      // Retorna en formato ISO de Colombia
      return localDate.toISOString().slice(0, 19).replace('T', ' ');
    }
    
  }
}, {
  sequelize,
  modelName: 'TrazabilidadEnvio',
  tableName: 'trazabilidad_envios_hc',
  timestamps: true
});
