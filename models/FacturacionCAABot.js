import { Model, DataTypes } from "sequelize";
import { sequelize } from '../db/database.js';

export class FacturacionCAABot extends Model {}

FacturacionCAABot.init({
    id: {
        type: DataTypes.INTEGER,
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
        onDelete: 'RESTRICT'
    },
    bot_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
            model: 'bots',
            key: 'id'
        },
        onDelete: 'RESTRICT'
    },
    maquina_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'maquinas',
            key: 'id'
        },
        onDelete: 'RESTRICT'
    },
    tipo_atencion: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    fecha_ingreso: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    fecha_egreso: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    num_atencion_go: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    num_atencion_indigo: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    num_estado_cuenta: {
        type: DataTypes.STRING(50),
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
}, {
    sequelize,
    modelName: 'FacturacionCAABot',
    tableName: 'facturacion_caa_bot',
    timestamps: true,
    indexes: [
        {
            unique: true, fields: ['num_atencion_go', 'num_estado_cuenta']
        }
    ]
});