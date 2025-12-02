import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/database.js';

export class NotaCreditoMasiva extends Model {}

NotaCreditoMasiva.init({
  id: {
    type: DataTypes.BIGINT,
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
    onDelete: 'SET NULL'
  },

  maquina_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },

  sede: {
    type: DataTypes.STRING(100),
    allowNull: false
  },

  prefijo: {
    type: DataTypes.STRING(10),
    allowNull: false
  },

  tipo: {
    type: DataTypes.STRING(10),
    allowNull: true
  },

  numero_factura1: {
    type: DataTypes.STRING(20),
    allowNull: false
  },

  numero_factura2: {
    type: DataTypes.STRING(10),
    allowNull: false
  },

  numero_factura3: {
    type: DataTypes.STRING(20),
    allowNull: false
  },

  valor: {
    type: DataTypes.DECIMAL(15,2),
    allowNull: false
  },

  nit: {
    type: DataTypes.STRING(20),
    allowNull: false
  },

  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  estado: {
    type: DataTypes.ENUM('pendiente', 'exito', 'error'),
    allowNull: false,
    defaultValue: 'pendiente'
  },

  fecha_ejecucion: {
    type: DataTypes.DATE,
    allowNull: true
  },

  cufe: {
    type: DataTypes.STRING(255),
    allowNull: true
  },

  cude: {
    type: DataTypes.STRING(255),
    allowNull: true
  },

  pdf: {
    type: DataTypes.STRING(300),
    allowNull: true
  },

}, {
  sequelize,
  modelName: 'NotaCreditoMasiva',
  tableName: 'notas_credito_masivas',
  timestamps: true,
  indexes: [
    { fields: ['bot_id'] },
    { fields: ['estado'] },
    { fields: ['maquina_id'] },
    { fields: ['bot_id', 'maquina_id', 'estado'] }
  ]
});
