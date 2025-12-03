import xlsx from 'xlsx';

export function extraerDatosSolicitudInactivacion(archivo) {
  try {
    const workbook = xlsx.read(archivo.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
    //console.log(rows);
    
    console.log(Object.keys(rows[0])); //para saber cuales son los nombres de las columnas
    const datosProcesados = rows.map((row) => ({
      nombre: row['NOMBRE COMPLETO'] || '',
      sucursal: row['SEDE'] || '',
      identificacion: row['IDENTIFICACION'] || '',
      fecha_inactivacion: excelSerialToDate(row['FECHA DE RETIRO']),
      cargo: row['CARGO'] || '',
      cuenta_delegar: row['CUENTA A DELEGAR'],
      buzon_compartido: row['BUZON COMPARTIDO (SI/NO)'] || '',
    }));
    //crear validacion si el archivo adjunto es el correcto
    const expectedColumns = ['NOMBRE COMPLETO', 'SEDE', 'IDENTIFICACION', 'FECHA DE RETIRO', 'CARGO', 'CUENTA A DELEGAR', 'BUZON COMPARTIDO (SI/NO)']
    const fileColumns = Object.keys(rows[0] || {});
    const columnsMatch = expectedColumns.every(col => fileColumns.includes(col));

    if (!columnsMatch) {
      const error = new Error('El archivo no tiene el formato esperado');
      error.status = 400;
      throw error;
    }
    return datosProcesados;
  } catch (error) {
    throw error;
  }
}

function excelSerialToDate(serial) {
  if (!serial || isNaN(serial)) return '';
  
  // Excel date serial → JavaScript Date
  const excelEpoch = new Date(1900, 0, 1);
  const date = new Date(excelEpoch.getTime() + (serial - 2) * 24 * 60 * 60 * 1000);

  // Formato YYYY-MM-DD (puedes cambiarlo)
  return date.toISOString().split('T')[0];
}
