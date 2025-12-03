import xlsx from 'xlsx';

export async function extraerDatos(archivo, sede, bot_id) {
  try {
    const workbook = xlsx.read(archivo.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
    //console.log(Object.keys(rows[0])); para saber cuales son los nombres de las columnas
    const datosProcesados = rows.map((row) => ({
      bot_id: bot_id,
      tipo: row['TIPO'] || '',
      prefijo: row['PREFIJO'] || '',
      numero_factura1: row['NUMERO FACTURA'] || '',
      numero_factura2: row['__EMPTY'] || '',
      numero_factura3: row['__EMPTY_1'] || '',
      valor: row['VALOR'],
      nit: row['NIT ASEGURADORA'] || '',
      descripcion: row['DESCRIPCION'] || '',
      sede: sede || '',
    }));
    //crear validacion si el archivo adjunto es el correcto
    const expectedColumns = ['TIPO', 'PREFIJO', 'NUMERO FACTURA', '__EMPTY', '__EMPTY_1', 'VALOR', 'NIT ASEGURADORA', 'DESCRIPCION'];
    const fileColumns = Object.keys(rows[0] || {});
    const columnsMatch = expectedColumns.every(col => fileColumns.includes(col));

    if (!columnsMatch) {
      const error = new Error('El archivo de notas de crédito no tiene el formato esperado');
      error.status = 400;
      throw error;
    }
    return datosProcesados;
  } catch (error) {
    throw error;
  }
}