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

export async function getDetalleVentasGo (numDoc, numAte) {
    try {
        const query = `
            --------DETALLE------
                DECLARE @Empresa int 
                DECLARE @NumDoc int
                DECLARE @NumAte int 
                --DECLARE @Contrato int 

                SET @Empresa = 740006
                SET @NumDoc = ${numDoc}
                SET @NumAte = ${numAte}
                --SET @Contrato = 1039


                SELECT BSAE.EncounterClass AS TipoAtencion, BSAE.Patient AS Paciente, BSAE.documentNumber AS identificacion, BSAE.dateRegister AS FechaIngreso, E.dateDischarge AS FechaEgreso, 
                    BSAE.dateDischarge AS FechaEC, DATEDIFF(day, BSAE.dateRegister, E.dateDischarge) AS Estancia, BSAE.EncounterNumber AS NumAtencion, BSAH.number AS NumEC, BSAH.status AS EstadoEC, BSAI.valueTotal AS ValorFacturaTotal, 
                    PT.name AS TipoProducto, BSAPD.categoryName AS Categoria, BSAPD.quantity AS Cantidad, BSAPD.saleNumber AS NumVenta, BSAPD.dateSale AS FechaVenta, BSAPD.codeProduct AS CodigoProducto, BSAPD.nameProduct AS Producto, 
                    BSAPD.value AS ValUnitario,	BSAPD.ValueCharges AS ValRecargo, BSAPD.valueDiscount AS ValDescuento, BSAPD.ValueTax AS ValImpuesto, BSAPD.valueNet AS ValorTotal
                FROM BillStateOfAccountEncounters BSAE
                    INNER JOIN encounters E WITH (NOLOCK) ON BSAE.idencounter = E.idencounter
                    INNER JOIN BillStateOfAccountHeader BSAH WITH (NOLOCK) ON BSAE.idStateOfAccountHeader = BSAH.idStateOfAccountHeader
                    INNER JOIN BillStateOfAccountInvoices BSAI WITH (NOLOCK) ON BSAE.idStateOfAccountHeader = BSAI.idStateOfAccountHeader AND BSAI.isPrincipal = 1
                    INNER JOIN BillStateOfAccountProductDetails BSAPD WITH (NOLOCK) ON BSAE.idStateOfAccountHeader = BSAPD.idStateOfAccountHeader
                    INNER JOIN productTypes PT ON PT.idProductType = BSAPD.idProductType
                WHERE E.idUserCompany = @Empresa AND BSAE.documentNumber = @NumDoc AND BSAE.EncounterNumber = @NumAte
                ORDER BY BSAPD.codeCategory`

        const resultado = await executeQuery(query);
        const formateada = resultado.recordset.map(item => ({
            ...item,
            Id: `${item.NumAtencion}-${item.NumVenta}`, // Genera un ID único combinando NumAtencion y NumVenta
            EstadoProceso: 'pendiente',
            Observacion: '' // Campo para observaciones, inicialmente vacío
        }));
        return formateada;
    } catch (error) {
        console.error('Error en getDetalleVentasGo:', error.message);
        throw new Error('Error al obtener detalle de ventas: ' + error.message);
    }
}