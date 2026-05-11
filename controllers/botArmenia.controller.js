import { getPacientesGo } from "../models/go_armenia.js";


export const botArmenia = {
    async getPacientes(req, res) {
        try {
            const {fecha_inicio, fecha_fin} = req.query;
            
            // Validar que las fechas estén presentes
            if (!fecha_inicio || !fecha_fin) {
                return res.status(400).json({message: "Se requieren fecha_inicio y fecha_fin en formato YYYYMMDD"});
            }
            
            // Validar formato YYYYMMDD (8 dígitos, sin separadores)
            const fechaRegex = /^\d{8}$/;
            if (!fechaRegex.test(fecha_inicio) || !fechaRegex.test(fecha_fin)) {
                return res.status(400).json({message: "Las fechas deben estar en formato YYYYMMDD (sin separadores)"});
            }
            
            const pacientes = await getPacientesGo(fecha_inicio, fecha_fin);
            res.status(200).json({status: 'success', data: pacientes.recordset || pacientes});

        } catch (err) {
            console.error('Error en getPacientes:', err);
            return res.status(500).json({ error: err.message || 'Error al obtener datos' });
        }
    }
}