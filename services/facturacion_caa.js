import { Op } from "sequelize";
import { FacturacionCAABot } from "../models/FacturacionCAABot.js";
import { getDetalleVentasGo, getPacientesGo } from "../models/go_armenia.js";
import { Paciente } from "../models/Paciente.js";
import { DetalleFacturacionCAABot } from "../models/DetalleFacturacionCAA.js";

export const FacturacionCAABotService = {
    async getFacturacionCAAGo(fecha_inicio, fecha_fin) {
        try {
            const facturacionGo = await getPacientesGo(fecha_inicio, fecha_fin);
            if (!facturacionGo) {
                throw new Error('Facturación CAA no encontrada');
            }

            const facturacionBot = await FacturacionCAABot.findAll({
                where: {
                    fecha_ingreso: {
                        [Op.between]: [fecha_inicio, fecha_fin]
                    }
                }
            });
            const facturacionGoFormateada = facturacionGo.recordset.map(item => {
                const match = facturacionBot.find(bot => bot.num_atencion_go == item.NumAtencion && bot.num_estado_cuenta == item.NumEstadoCuenta);
                return {
                    ...item,
                    Id: item.NumAtencion, // Genera un ID único basado en NumAtencion
                    BotId: match ? match.bot_id : null,
                    MaquinaId: match ? match.maquina_id : null,
                    NumAtencionIndigo: match ? match.num_atencion_indigo : null,
                    EstadoProceso: match ? match.estado_proceso : 'pendiente',
                    Observacion: match ? match.observacion : '' // Campo para observaciones, inicialmente vacío
                };
            });
            return facturacionGoFormateada;
        } catch (error) {
            throw new Error('Error al obtener facturación CAA: ' + error.message);
        }
    },
    async getDetalleVentasGo(documento, atencion_go) {
        try {
            const detalleVentas = await getDetalleVentasGo(documento, atencion_go);
            if (!detalleVentas) {
                throw new Error('Detalle de ventas no encontrado');
            }
            const detalleBot = await DetalleFacturacionCAABot.findOne({
                where: {
                    doc_paciente: documento, num_atencion_go: atencion_go
                }
            });
            const detalleVentasFormateada = detalleVentas.recordset.map(item => ({
                ...item,
                EstadoProceso: detalleBot?.estado_proceso || 'pendiente',
                Observacion: detalleBot?.observacion || null
            }));
            
            return detalleVentasFormateada;

        } catch (error) {
            throw new Error('Error al obtener detalle de ventas: ' + error.message);
        }
    },
    async createFacturacionCAABot(data) {
        try {
            const DetalleFacturacionCAAGo = await getDetalleVentasGo(data.doc_paciente, data.num_atencion_go);

            if (!DetalleFacturacionCAAGo || !DetalleFacturacionCAAGo.recordset || DetalleFacturacionCAAGo.recordset.length === 0) {
                throw new Error('No se pudo obtener el detalle de la Factura');
            }
            
            const paciente = await Paciente.findOrCreate({
                where: { numero_identificacion: data.doc_paciente },
                defaults: {
                    nombre: data.nom_paciente
                }
            });

            const [facturacionCAABot, created] = await FacturacionCAABot.findOrCreate({
                where: {
                    paciente_id: paciente[0].id, num_atencion_go: data.num_atencion_go
                },
                defaults: {
                    bot_id: data.bot_id,
                    maquina_id: data.maquina_id,
                    tipo_atencion: data.tipo_atencion,
                    fecha_ingreso: data.fecha_ingreso,
                    fecha_egreso: data.fecha_egreso,
                    num_atencion_indigo: data.num_atencion_indigo,
                    num_estado_cuenta: data.num_estado_cuenta
                }
            });

            // Actualizar si la facturación ya existía y cambió num_atencion_indigo
            if (!created && facturacionCAABot.num_atencion_indigo !== data.num_atencion_indigo) {
                await FacturacionCAABot.update(
                    { num_atencion_indigo: data.num_atencion_indigo },
                    { where: { id: facturacionCAABot.id } }
                );
            }

            for (const detalle of DetalleFacturacionCAAGo.recordset) {
                await DetalleFacturacionCAABot.findOrCreate({
                    where: {
                        num_venta: detalle.NumVenta,
                        num_atencion_go: data.num_atencion_go
                    },
                    defaults: {
                        facturacion_caa_id: facturacionCAABot.id,
                        doc_paciente: data.doc_paciente,
                        num_estado_cuenta: data.num_estado_cuenta,
                        cod_producto: detalle.CodigoProducto,
                        categoria: detalle.Categoria,
                        cantidad: detalle.Cantidad
                    }
                });
            }

            return facturacionCAABot;
        } catch (error) {
            throw new Error('Error al crear facturación CAA: ' + error.message);
        }
    },
    async factutasProcesar(maquina_id) {
        try {
            const facturasCAA = await FacturacionCAABot.findAll({
                where: {
                    maquina_id,
                    estado_proceso: 'pendiente'
                },
                include: [
                    {
                        model: DetalleFacturacionCAABot,
                        as: 'detalles'
                    }
                ]
            });
            return facturasCAA;
        } catch (error) {
            throw new Error("Error al obtener las facturas a procesar CAA: " + error.message);
        }
    }
};