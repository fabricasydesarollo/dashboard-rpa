import { getDetalleVentasGo, getPacientesGo } from '../models/go_armenia.js'
import { FacturacionCAABotService } from '../services/facturacion_caa.js'
import { RegistroGeneralController } from './registroGeneral.controller.js'
import { RegistroGeneralService } from '../services/registro-general.js'

export const botArmenia = {
  async getPacientes (req, res) {
    try {
      const { fecha_inicio, fecha_fin } = req.query

      // Validar que las fechas estén presentes
      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({ message: 'Se requieren fecha_inicio y fecha_fin en formato YYYYMMDD' })
      }

      // Validar formato YYYYMMDD (8 dígitos, sin separadores)
      const fechaRegex = /^\d{8}$/
      if (!fechaRegex.test(fecha_inicio) || !fechaRegex.test(fecha_fin)) {
        return res.status(400).json({ message: 'Las fechas deben estar en formato YYYYMMDD (sin separadores)' })
      }

      const pacientes = await FacturacionCAABotService.getFacturacionCAAGo(fecha_inicio, fecha_fin)
      res.status(200).json({ status: 'success', data: pacientes.recordset || pacientes })
    } catch (err) {
      console.error('Error en getPacientes:', err)
      return res.status(500).json({ error: err.message || 'Error al obtener datos' })
    }
  },
  async getDetalleVentasGo (req, res) {
    try {
      const { documento, atencion_go } = req.query
      // Validar que numDoc y numAte estén presentes
      if (!documento || !atencion_go) {
        return res.status(400).json({ message: 'Se requieren documento y atencion_go como parámetros' })
      }
      const detalleVentas = await FacturacionCAABotService.getDetalleVentasGo(documento, atencion_go)
      // console.log(detalleVentas)
      res.status(200).json({ status: 'success', data: detalleVentas.recordset || detalleVentas })
    } catch (err) {
      console.error('Error en getDetalleVentasGo:', err)
      return res.status(500).json({ error: err.message || 'Error al obtener detalle de ventas' })
    }
  },
  async createFacturacionCAABot (req, res) {
    try {
      const registros = req.body

      if (!Array.isArray(registros) || registros.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Debe ser una lista de registros con al menos 1 elemento'
        })
      }
      const facturacionDataList = []

      for (const registro of registros) {
        const { bot_id, maquina_id, doc_paciente, nom_paciente, tipo_atencion, fecha_ingreso, fecha_egreso, num_atencion_go, num_atencion_indigo, num_estado_cuenta } = registro

        if (!bot_id || !maquina_id || !doc_paciente || !nom_paciente || !tipo_atencion || !fecha_ingreso || !fecha_egreso || !num_atencion_go || !num_atencion_indigo || !num_estado_cuenta) {
          return res.status(400).json({ message: 'Faltan datos requeridos para crear la facturación CAA' })
        }

        const facturacionData = await FacturacionCAABotService.createFacturacionCAABot({
          bot_id,
          maquina_id,
          doc_paciente,
          nom_paciente,
          tipo_atencion,
          fecha_ingreso,
          fecha_egreso,
          num_atencion_go,
          num_atencion_indigo,
          num_estado_cuenta
        })

        facturacionDataList.push(facturacionData)
      }

      res.status(201).json({ status: 'success', message: 'Facturación CAA creada exitosamente', data: facturacionDataList })
    } catch (err) {
      console.error('Error en createFacturacionCAABot:', err)
      return res.status(500).json({ error: err.message || 'Error al crear facturación CAA' })
    }
  },
  async factutasProcesarBot (req, res) {
    try {
      const { maquina_id } = req.query
      if (!maquina_id) {
        return res.status(400).json({ message: 'Falta maquina_id para procesar la busqueda em CAA' })
      }
      const taskPending = await FacturacionCAABotService.factutasProcesar(maquina_id)
      res.status(201).json({ status: 'success', data: taskPending })
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Error al obtener las tareas CAA' })
    }
  },
  async updateEstadoDetalles (req, res) {
    try {
      const { paciente_id, doc_paciente, num_atencion_go, num_venta, cod_producto, estado, mensaje } = req.body
      // console.info('Datos recibidos en updateEstadoDetalles:', req.body);
      if (!num_atencion_go || !paciente_id || !num_venta || !doc_paciente || !cod_producto || !estado || !mensaje) {
        return res.status(400).json({ status: 'error', message: 'Faltan datos requeridos para actualizar el estado de detalles de la factura' })
      }

      const response = await FacturacionCAABotService.updateEstadoDetalles({
        paciente_id,
        doc_paciente,
        num_atencion_go,
        num_venta,
        cod_producto,
        estado,
        mensaje
      })

      res.status(200).json({ status: 'success', message: 'Estado de factura actualizado exitosamente', data: response })
    } catch (err) {
      console.error('Error en updateEstadoDetalles:', err)
      return res.status(500).json({ status: 'error', message: err.message || 'Error al actualizar el estado de detalle de la factura' })
    }
  },
  async updateEstadoCabecera (req, res) {
    try {
      const { paciente_id, maquina_id, doc_paciente, num_atencion_go } = req.body
      // console.info('Datos recibidos en updateEstadoCabecera:', req.body);

      if (!paciente_id || !maquina_id || !num_atencion_go || !doc_paciente) {
        return res.status(400).json({ status: 'error', message: 'Faltan datos requeridos para actualizar el estado de la factura' })
      }

      const response = await FacturacionCAABotService.updateEstadoCabecera({ paciente_id, maquina_id, num_atencion_go, doc_paciente })
      res.status(200).json({ status: 'success', message: 'Estado de factura actualizado exitosamente', data: response })
    } catch (err) {
      console.error('Error en updateEstadoCabecera:', err)
      return res.status(500).json({ status: 'error', message: err.message || 'Error al actualizar el estado de la factura' })
    }
  },
  async ejecutarProcesoBot (req, res) {
    try {
      const url = `${process.env.RPA_API_URL}/ejecutar-rpa`

      const respuesta = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await respuesta.json()
      const esExitoso = Boolean(data?.status)

      const reqRegistro = {
        ...req,
        body: {
          bot_id: 12,
          maquina_id: 14,
          estado: esExitoso ? 'proceso' : 'error',
          estado_bot: esExitoso ? 'ejecucion' : 'error',
          mensaje: esExitoso ? 'El bot inició el procesamiento correctamente' : (data?.detail || 'Error en el bot')
        }
      }

      await RegistroGeneralController.create(reqRegistro, res)

      if (!respuesta.ok) {
        return res.status(respuesta.status).json({
          success: false,
          message: data?.detail || 'Error al ejecutar el microservicio RPA',
          error: data
        })
      }

      return res.status(200).json({
        success: true,
        message: 'Proceso RPA ejecutado correctamente',
        data
      })
    } catch (err) {
      console.error('Error ejecutando proceso RPA:', err)

      return res.status(500).json({
        success: false,
        message: 'No fue posible comunicarse con el microservicio RPA',
        error: err.message
      })
    }
  },
  async updateDetallesBot (req, res) {
    try {
      const { documento, atencion_go } = req.query
      // Validar que numDoc y numAte estén presentes
      if (!documento || !atencion_go) {
        return res.status(400).json({ message: 'Se requieren documento y atencion_go como parámetros' })
      }
      const response = await FacturacionCAABotService.updateDetallesBot({ documento, atencion_go })
      res.status(200).json({ status: 'success', message: response.mensaje, data: response })
    } catch (err) {
      console.error('Error en updateDetallesBot:', err)
      return res.status(500).json({ error: err.message || 'Error al actualizar los detalles de ventas' })
    }
  }
}
