import { executeQuery } from "../db/go_database.js";

export async function getPacientesGo (fecha_inicio, fecha_fin) {
    try {
        const query = `
                DECLARE @Empresa int 
                DECLARE @Sede int
                DECLARE @fecini datetime
                DECLARE @fecfin datetime

                SET @Empresa = 740006
                SET @Sede = 45
                SET @fecini = '${fecha_inicio} 00:00:01'
                SET @fecfin = '${fecha_fin} 23:59:59'

                SELECT top 10 C.NAME AS Oficina, UCTD.code AS Tipo_documento, U.documentNumber AS Documento,
                    ltrim(rtrim(U.givenname)) + ' ' + ltrim(rtrim(U.familyname)) as Paciente, E.dateStart as Fecha_ingreso, E.identifier as Num_ingreso
                FROM [dbo].[encounters] E WITH (NOLOCK) 
                    INNER JOIN [dbo].[companyOffices] C WITH (NOLOCK) ON C.idUserCompany = E.idUserCompany AND C.IDOFFICE = E.IDOFFICE
                    INNER JOIN [dbo].[companies] D WITH (NOLOCK) ON D.idUserCompany = C.idUserCompany
                    INNER JOIN [dbo].[users] F WITH (NOLOCK) ON E.idUserCompany = F.idUser
                    INNER JOIN [dbo].[users] U WITH (NOLOCK) ON E.idUserPATIENT = U.idUser
                    INNER JOIN [dbo].[userConfTypeDocuments] UCTD WITH (NOLOCK) ON U.IdDocumentType = UCTD.IdTypeDocument
                where E.idUserCompany = @Empresa and E.idOffice = @Sede AND E.dateStart between @fecini and @fecfin
                ORDER BY 1,2,3
            `

        const resultado = await executeQuery(query);
        return resultado

    } catch (error) {
        console.error('Error en getPacientesGo:', error.message);
        throw new Error('Error al obtener pacientes: ' + error.message);
    }
}