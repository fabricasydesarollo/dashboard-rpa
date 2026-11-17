import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../db/database.js'

export class ArCuGlosas extends Model { }

ArCuGlosas.init({
  ArCuEmp: {
    type: DataTypes.STRING(10),
    primaryKey: true,
    allowNull: false
  },
  ArCuSed: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: null
  },
  ArCuPref: {
    type: DataTypes.STRING(10),
    primaryKey: true,
    allowNull: false
  },
  ArCuFac: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false
  },
  ArCuCodAse: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  ArCuIdRadicado: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  ArCuFecRadicado: {
    type: DataTypes.DATE(3),
    allowNull: true
  },
  ArCuFecGlosa: {
    type: DataTypes.DATE(3),
    allowNull: false
  },
  ArCuObs: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    defaultValue: ''
  },
  ArCuEst: {
    type: DataTypes.STRING(1),
    allowNull: false,
    defaultValue: '0'
  },
  UsuAdd: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  FecAdd: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  UsuMod: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  FecMod: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'ArCuGlosas',
  tableName: 'ArCuGlosas',
  freezeTableName: true,
  timestamps: false,
  indexes: [
    // ArCuSed queda fuera del UNIQUE porque siempre es NULL y MySQL permite múltiples NULL en índices únicos
    { unique: true, name: 'IU_ArCuGlosas', fields: ['ArCuEmp', 'ArCuPref', 'ArCuFac'] },
    { name: 'IX_ArCuGlosas_1', fields: ['ArCuFecGlosa'] },
    { name: 'IX_ArCuGlosas_2', fields: ['FecAdd'] }
  ]
})
