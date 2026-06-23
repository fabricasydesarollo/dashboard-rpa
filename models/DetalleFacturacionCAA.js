import { DataTypes, Model } from "sequelize";
import { sequelize } from '../db/database.js';


export class DetalleFacturacionCAABot extends Model{}

DetalleFacturacionCAABot.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    facturacion_caa_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'facturacion_caa_bot',
            key: 'id'
        },
        onDelete: 'RESTRICT'
    },
    doc_paciente: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    num_atencion_go: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    num_venta: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    num_estado_cuenta: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cod_producto: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    estado_proceso: {
        type: DataTypes.ENUM('pendiente', 'procesado', 'error'),
        allowNull: false,
        defaultValue: 'pendiente'
    },
    observacion: {
        type: DataTypes.TEXT,
        allowNull: true
    }
},
{
    sequelize,
    modelName: 'DetalleFacturacionCAABot',
    tableName: 'detalle_facturacion_caa_bot',
    timestamps: true,
    indexes: [
        {
            unique: true, fields: ['num_atencion_go', 'num_estado_cuenta']
        }
    ]
})