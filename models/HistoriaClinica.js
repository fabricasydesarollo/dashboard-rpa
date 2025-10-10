import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/database.js';

export class HistoriaClinica extends Model {}

HistoriaClinica.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  paciente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'pacientes',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  ingreso: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  fecha_historia: {
    type: DataTypes.DATE,
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('fecha_historia');
      if (!rawValue) return null;
      
      // Convierte la fecha UTC a Colombia (UTC-5)
      const date = new Date(rawValue);
      const colombiaOffset = -5 * 60; // -5 horas en minutos
      const localDate = new Date(date.getTime() + (colombiaOffset * 60 * 1000));
      
      // Retorna en formato ISO de Colombia
      return localDate.toISOString().slice(0, 19).replace('T', ' ');
    }
  },
  folio: {
    type: DataTypes.STRING(50),
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'HistoriaClinica',
  tableName: 'historias_clinicas',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['ingreso', 'folio'] // <- combinación única
    }
  ]
});
