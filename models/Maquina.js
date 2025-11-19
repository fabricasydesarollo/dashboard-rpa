import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/database.js';

export class Maquina extends Model {}

Maquina.init({
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,       // Parte de la PK compuesta
    autoIncrement: false    // YA NO autoincrementa
  },

  bot_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,        // Parte de la PK compuesta
    allowNull: false,
    references: {
      model: 'bots',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },

  estado: {
    type: DataTypes.ENUM('ejecucion', 'pausado', 'activo', 'error'),
    allowNull: false,
    defaultValue: 'activo'
  },

  total_registros: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },

  procesados: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }

}, {
  sequelize,
  modelName: 'Maquina',
  tableName: 'maquinas',
  timestamps: true,
  indexes: [
    { fields: ['bot_id'] }
  ]
});
