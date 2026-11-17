import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../db/database.js'

export class ArCuGlosasDet extends Model { }

ArCuGlosasDet.init({
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
  ArCuFac: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false
  },
  ArCuPref: {
    type: DataTypes.STRING(10),
    primaryKey: true,
    allowNull: false
  },
  ArCuValFac: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  ArCuCodCups: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ArCuCodAse: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  ArCuIdRadicado: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  ArCuIdGlosa: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  ArCuValGlosa: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  ArCuValGestion: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  ArCuDiasGlosa: {
    type: DataTypes.SMALLINT,
    allowNull: false
  },
  ArCuCodReso: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  ArCuCodReso2: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ArCuCodReso3: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ArCuItem: {
    type: DataTypes.SMALLINT,
    primaryKey: true,
    allowNull: false,
    defaultValue: 1
  },
  ArCuValApro: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  ArCuValApro2: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  ArCuValNoApro: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  ArCuValNoApro2: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  ArCuCodRes: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ArCuCodRes2: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ArCuCodRes3: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ArCuCodResSecu: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ArCuCodResSecu2: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ArCuCodResSecu3: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ArCuFecGlosa: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ArCuFecRatificada: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ArCuFecEstadoFinal: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ArCuFecRes: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ArCuFecRes2: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ArCuFecRes3: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ArCuFecResSecu: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ArCuFecResSecu2: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ArCuFecResSecu3: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ArCuFecCieRespondida: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ArCuFecCieRatificada: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ArCuAud: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: 'N'
  },
  ArCuNomCarpeta: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  ArCuEstGlosa: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '1'
  },
  ArCuObsGlosa: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  ArCuObsRespIps: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  ArCuObsRespIpsSecu: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  ArCuObsRatificada: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  ArCuObsRatificada2: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  ArCuObsRespServ: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  ArCuEst: {
    type: DataTypes.STRING(1),
    allowNull: true,
    defaultValue: '0'
  },
  UsuPlataforma: {
    type: DataTypes.STRING(100),
    allowNull: true
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
  modelName: 'ArCuGlosasDet',
  tableName: 'ArCuGlosasDet',
  freezeTableName: true,
  timestamps: false,
  indexes: [
    { unique: true, name: 'IU_ArCuGlosasDet', fields: ['ArCuEmp', 'ArCuPref', 'ArCuFac', 'ArCuIdGlosa', 'ArCuItem'] },
    { name: 'IX_ArCuGlosasDet_1', fields: ['ArCuFecGlosa'] },
    { name: 'IX_ArCuGlosasDet_2', fields: ['ArCuFecRes'] },
    { name: 'IX_ArCuGlosasDet_3', fields: ['FecAdd'] },
    { name: 'IX_ArCuGlosasDet_5', fields: ['ArCuCodReso'] },
    { name: 'IX_ArCuGlosasDet_6', fields: ['ArCuCodRes'] }
  ]
})
