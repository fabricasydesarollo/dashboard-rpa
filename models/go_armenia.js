import { executeQuery } from "../db/go_database.js";

export async function getPacientesGo (fecha_inicio, fecha_fin) {
    try {
        const query = `
            DECLARE @Empresa int 
            DECLARE @fecEgrInicio datetime
            DECLARE @fecEgrFin datetime
            --DECLARE @Contrato int 

            SET @Empresa = 740006
            SET @fecEgrInicio = '${fecha_inicio} 00:00:01'
            SET @fecEgrFin = '${fecha_fin} 23:59:59'
            --SET @Contrato = 1039

            SELECT BSAE.EncounterClass AS TipoAtencion, BSAE.documentNumber AS Identificacion, BSAE.Patient AS Paciente, 
                BSAE.dateRegister AS FechaIngreso, E.dateDischarge AS FechaEgreso, 
                BSAE.dateDischarge AS FechaEstadoCuenta, DATEDIFF(day, BSAE.dateRegister, E.dateDischarge) AS Estancia,
                BSAE.EncounterNumber AS NumAtencion, BSAH.number AS NumEstadoCuenta, BSAH.status AS EstadoCuenta
            FROM BillStateOfAccountEncounters BSAE
                INNER JOIN encounters E WITH (NOLOCK) ON BSAE.idencounter = E.idencounter
                INNER JOIN BillStateOfAccountHeader BSAH WITH (NOLOCK) ON BSAE.idStateOfAccountHeader = BSAH.idStateOfAccountHeader
            WHERE E.idUserCompany = @Empresa AND BSAH.status = 'FC' AND BSAE.documentNumber != ''
                AND BSAE.dateDischarge BETWEEN @fecEgrInicio AND @fecEgrFin;
            `

        const resultado = await executeQuery(query);
        return resultado

    } catch (error) {
        console.error('Error en getPacientesGo:', error.message);
        throw new Error('Error al obtener pacientes: ' + error.message);
    }
}