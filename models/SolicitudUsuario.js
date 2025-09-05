// models/SolicitudUsuario.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/database.js';

export class SolicitudUsuario extends Model {}

SolicitudUsuario.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users', // Nombre real de la tabla en la DB
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  bot_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'bots',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  identificacion: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  fecha_inactivacion: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  buzon_compartido: {
    type: DataTypes.ENUM('si', 'no'),
    allowNull: false,
  },
  cargo: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  cuenta_delegar: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  sucursal: {
    type: DataTypes.STRING(150),
    allowNull: true,
    defaultValue: null, // ✅ por defecto será NULL
  },
  estado: {
    type: DataTypes.ENUM('exito', 'proceso', 'error'),
    allowNull: false,
    defaultValue: 'proceso'
  },
}, {
  sequelize,
  modelName: 'SolicitudUsuario',
  tableName: 'solicitudes_usuario',
  timestamps: true,
});
