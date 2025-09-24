import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/database.js';

export class Paciente extends Model {}

Paciente.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero_identificacion: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  correo_electronico: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  empresa: {
    type: DataTypes.STRING(150),
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Paciente',
  tableName: 'pacientes',
  timestamps: true
});
