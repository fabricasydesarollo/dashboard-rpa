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
    allowNull: false
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
