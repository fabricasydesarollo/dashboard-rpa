import {Op} from "sequelize";
import {FacturacionCAABot} from "../models/FacturacionCAABot.js";
import {getDetalleVentasGo, getPacientesGo} from "../models/go_armenia.js";
import {Paciente} from "../models/Paciente.js";
import {DetalleFacturacionCAABot} from "../models/DetalleFacturacionCAA.js";
import {sequelize} from "../db/database.js";

export const FacturacionCAABotService = {
    async getFacturacionCAAGo(fecha_inicio, fecha_fin) {
        try {
            const facturacionGo = await getPacientesGo(fecha_inicio, fecha_fin);
            if (!facturacionGo) {
                throw new Error('Facturación CAA no encontrada');
            }

            const facturacionBot = await FacturacionCAABot.findAll({
                where: {
                    fecha_egreso: {
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
            // console.debug("Detalles de venta (query):", detalleVentas);
            // if (!detalleVentas) {
            //     throw new Error('Detalle de ventas no encontrado');
            // }
            // const detalleBot = await DetalleFacturacionCAABot.findOne({
            //     where: {
            //         doc_paciente: documento, num_atencion_go: atencion_go
            //     }
            // });
            // console.info(detalleBot)
            // const detalleVentasFormateada = detalleVentas.recordset.map(item => ({
            //     ...item,
            //     // Categoria: ['medicamentos','insumos'].includes(item.TipoProducto?.toLowerCase()) ? 'Medicamentos' : 'Procedimientos',
            //     EstadoProceso: detalleBot?.estado_proceso || 'pendiente',
            //     Observacion: detalleBot?.observacion || null
            // }));
            //
            // return detalleVentasFormateada;

            return await Promise.all(
                detalleVentas.recordset.map(async item => {
                    const detalleBot = await DetalleFacturacionCAABot.findOne({
                        where: {
                            doc_paciente: documento,
                            num_atencion_go: atencion_go,
                            num_venta: item.NumVenta
                        }
                    });

                    return {
                        ...item,
                        EstadoProceso: detalleBot?.estado_proceso || 'pendiente',
                        Observacion: detalleBot?.observacion || null
                    };
                })
            );

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

            // for (const detalle of DetalleFacturacionCAAGo.recordset) {
            //     await DetalleFacturacionCAABot.findOrCreate({
            //         where: {
            //             num_venta: detalle.NumVenta,
            //             num_atencion_go: data.num_atencion_go,
            //             cod_producto: detalle.CodigoProducto,
            //         },
            //         defaults: {
            //             facturacion_caa_id: facturacionCAABot.id,
            //             doc_paciente: data.doc_paciente,
            //             num_estado_cuenta: data.num_estado_cuenta,
            //             cod_producto: detalle.CodigoProducto,
            //             categoria: detalle.Categoria,
            //             cantidad: detalle.Cantidad,
            //             tipo_producto: detalle.TipoProducto
            //         }
            //     });
            // }

            const registrosAInsertar = DetalleFacturacionCAAGo.recordset.map(detalle => ({
                facturacion_caa_id: facturacionCAABot.id,
                num_venta: detalle.NumVenta,
                num_atencion_go: data.num_atencion_go,
                doc_paciente: data.doc_paciente,
                num_estado_cuenta: data.num_estado_cuenta,
                cod_producto: detalle.CodigoProducto,
                categoria: detalle.Categoria,
                cantidad: detalle.Cantidad,
                tipo_producto: detalle.TipoProducto
            }));

            await DetalleFacturacionCAABot.bulkCreate(registrosAInsertar);

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
                    estado_proceso: {
                        [Op.in]: ['pendiente', 'error']
                    }
                },
                include: [
                    {
                        model: DetalleFacturacionCAABot,
                        as: 'detalles',
                        where: {
                            estado_proceso: {
                                [Op.in]: ['pendiente', 'error']
                            }
                        }
                    }
                ]
            });
            facturasCAA.forEach((factura) => {
                factura.detalles.forEach((detalle) => {
                    if (detalle.categoria) {
                        detalle.tipo_producto = ['medicamentos', 'insumos'] .includes(detalle.tipo_producto?.toLowerCase()) ? 'Medicamentos' : 'Procedimientos';
                    }
                });
            });
            return facturasCAA;
        } catch (error) {
            throw new Error("Error al obtener las facturas a procesar CAA: " + error.message);
        }
    },
    async updateEstadoDetalles(data) {
        const transaction = await sequelize.transaction();

        try {
            const registroDetalleFactura =
                await DetalleFacturacionCAABot.findOne({
                    where: {
                        doc_paciente: data.doc_paciente,
                        num_atencion_go: data.num_atencion_go,
                        num_venta: data.num_venta,
                    },
                    transaction
                });

            if (!registroDetalleFactura) {
                throw new Error(
                    'Registro de detalle de la factura no encontrado'
                );
            }

            await registroDetalleFactura.update(
                {
                    estado_proceso: data.estado,
                    observacion: data.mensaje
                },
                { transaction }
            );

            await transaction.commit();

            return registroDetalleFactura;

        } catch (error) {

            await transaction.rollback();

            throw new Error(
                `Error al actualizar el estado de la factura: ${error.message}`
            );
        }
    },
    async updateEstadoCabecera(data){
        try{

            function obtenerEstadoCabecera(detalles) {
                if (!detalles?.length) {
                    console.debug("detalles vacio")
                    return "pendiente";
                }

                if (detalles.some(d => d.estado_proceso === "error")) {
                    return "error";
                }

                if (detalles.every(d => d.estado_proceso === "procesado")) {
                    return "procesado";
                }

                return "pendiente";
            }

            // const registrosDetalleFactura = await getDetalleVentasGo(data.doc_paciente, data.num_atencion_go);
            const registrosDetalleFactura = await DetalleFacturacionCAABot.findAll({
                where: {
                    doc_paciente: data.doc_paciente,
                    num_atencion_go: data.num_atencion_go,
                }
            });

            const estadoCabecera = obtenerEstadoCabecera(registrosDetalleFactura);

            const transaction = await sequelize.transaction();

            const registroCabeceraFactura = await FacturacionCAABot.findOne(
                {
                    where: {paciente_id: data.paciente_id, maquina_id: data.maquina_id, num_atencion_go: data.num_atencion_go},
                    transaction
                }
            )

            if (!registroCabeceraFactura) {
                throw new Error('Registro de detalle de la factura no encontrado');
            }

            await registroCabeceraFactura.update(
                {
                    estado_proceso: estadoCabecera,
                },
                { transaction }
            );

            await transaction.commit();

            return registroCabeceraFactura;

        }catch(error){
            await transaction.rollback();

            throw new Error(
                `Error al actualizar el estado de la factura: ${error.message}`
            );
        }
    },
    async updateDetallesBot(data) {
        const transaction = await sequelize.transaction();
        try {
            const respuestaGo = await getDetalleVentasGo(data.documento, data.atencion_go);
            const registrosActualizados = respuestaGo?.recordset || [];

            const detallesActivosDB = await DetalleFacturacionCAABot.findAll({
                where: {
                    num_atencion_go: data.atencion_go,
                    estado: 1
                },
                raw: true,
                transaction
            });

            const getKey = (item) => `${item.NumVenta ?? item.num_venta}-${item.CodigoProducto ?? item.cod_producto}`;

            const keysBD = new Set(detallesActivosDB.map(getKey));
            const keysFrescas = new Set(registrosActualizados.map(getKey));

            const idsDesactivar = detallesActivosDB
                .filter(r => !keysFrescas.has(getKey(r)))
                .map(r => r.id);

            if (idsDesactivar.length > 0) {
                await DetalleFacturacionCAABot.update(
                    { estado: 0 },
                    {
                        where: { id: idsDesactivar },
                        transaction
                    }
                );
            }

            const nuevosRegistros = registrosActualizados.filter(r => !keysBD.has(getKey(r)));

            if (nuevosRegistros.length > 0) {
                const nuevosFormatted = nuevosRegistros.map(detalle => ({
                    num_venta: detalle.NumVenta,
                    num_atencion_go: detalle.NumAtencion ?? data.atencion_go,
                    doc_paciente: detalle.identificacion ?? data.documento,
                    num_estado_cuenta: detalle.NumEC,
                    cod_producto: detalle.CodigoProducto,
                    categoria: detalle.Categoria,
                    cantidad: detalle.Cantidad,
                    tipo_producto: detalle.TipoProducto,
                    estado: 1
                }));

                await DetalleFacturacionCAABot.bulkCreate(nuevosFormatted, { transaction });
            }

            await transaction.commit();

            const totalDesactivados = idsDesactivar.length;
            const totalInsertados = nuevosRegistros.length;

            let mensaje = "No se encontraron cambios en los detalles; la información ya está al día.";

            if (totalDesactivados > 0 && totalInsertados > 0) {
                mensaje = `Sincronización completada: se desactivaron ${totalDesactivados} registros y se insertaron ${totalInsertados} nuevos.`;
            } else if (totalDesactivados > 0) {
                mensaje = `Sincronización completada: se desactivaron ${totalDesactivados} registros obsoletos.`;
            } else if (totalInsertados > 0) {
                mensaje = `Sincronización completada: se insertaron ${totalInsertados} registros nuevos.`;
            }

            return {
                success: true,
                mensaje,
                modificado: totalDesactivados > 0 || totalInsertados > 0,
                metricas: {
                    desactivados: totalDesactivados,
                    insertados: totalInsertados
                }
            };

        } catch (error) {
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }

            throw new Error(`Error al actualizar los detalles de la factura: ${error.message}`);
        }
    }
};