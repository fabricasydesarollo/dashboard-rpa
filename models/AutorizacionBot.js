import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/database.js';

export class AutorizacionBot extends Model {}

AutorizacionBot.init({
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  paciente_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'pacientes',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  bot_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'bots',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  idOrden: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  grupoAtencion: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  empresa: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  sede: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  fechaSolicitud: {
    type: DataTypes.DATE,
    allowNull: true
  },
  CUPS: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  desRelacionada: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  diagnostico: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  numIngreso: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  numFolio: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  contratado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ordenDuplicada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  anulada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  activoEPS: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  gestionadoTramita: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  metodoRadicacion: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  nroAutorizacionRadicado: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  fechaAutorizacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fechaVencimiento: {
    type: DataTypes.DATE,
    allowNull: true
  },
  inicio_proceso: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fin_proceso: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('exito', 'error', 'pendiente','proceso'),
    allowNull: false
  },
  estado_autorizacion:{
    type: DataTypes.ENUM('autorizado','radicado','rechazado','vencido','pendiente'),
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'AutorizacionBot',
  tableName: 'autorizaciones_bot',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['idOrden'] } // único actual
  ]
});
