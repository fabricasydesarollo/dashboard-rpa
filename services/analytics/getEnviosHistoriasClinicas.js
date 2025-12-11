import { Op } from 'sequelize';
import { TrazabilidadEnvio } from '../../models/TrazabilidadEnvio.js';

const botHistoriasClinicasId = 7;

export const getEnviosHistoriasClinicas = async (modo = "semanal") => {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = hoy.getMonth(); // 0–11

  let inicio, fin;

  if (modo === "semanal") {
    // ÚLTIMA SEMANA COMPLETA (lunes a domingo de la semana pasada)
    const diaSemana = hoy.getDay(); // 0 = dom, 1 = lun, ..., 6 = sáb
    const diasHastaLunesPasado = diaSemana === 0 ? -13 : -6 - diaSemana;

    inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() + diasHastaLunesPasado);
    inicio.setHours(0, 0, 0, 0);

    fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);
    fin.setHours(23, 59, 59, 999);
  } else if (modo === "mensual") {
    // Mes actual
    inicio = new Date(año, mes, 1);
    fin = new Date(año, mes + 1, 0, 23, 59, 59);
  } else if (modo === "anual") {
    // Año actual
    inicio = new Date(año, 0, 1);
    fin = new Date(año, 11, 31, 23, 59, 59);
  } else {
    return { error: "Modo inválido" };
  }

  // TRAER REGISTROS DEL RANGO
  const registros = await TrazabilidadEnvio.findAll({
    where: {
      bot_id: botHistoriasClinicasId,
      updatedAt: { [Op.between]: [inicio, fin] }
    },
    attributes: ["id", "updatedAt"]
  });

  // PROCESAMIENTO SEGÚN MODO
  switch (modo) {
    case "semanal":
      return { semanal: procesarSemanal(registros, inicio, fin) };
    case "mensual":
      return { mensual: procesarMensual(registros) };
    case "anual":
      return { anual: procesarAnual(registros) };
    default:
      return { error: "Modo inválido" };
  }
};

//  Procesamiento SEMANAL CORREGIDO → solo para los 7 días reales del rango
function procesarSemanal(registros, inicioSemana, finSemana) {
  const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const conteo = Array(7).fill(0);

  //  Generar mapa: "YYYY-MM-DD" → índice (0=Lun, ..., 6=Dom)
  const mapaFechas = {};
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(inicioSemana);
    fecha.setDate(inicioSemana.getDate() + i);
    const key = fecha.toISOString().split('T')[0]; // "2025-12-01"
    mapaFechas[key] = i;
  }

  // Contar solo registros dentro del rango exacto
  registros.forEach(r => {
    const fecha = new Date(r.updatedAt);
    const key = fecha.toISOString().split('T')[0];
    const idx = mapaFechas[key];
    if (idx !== undefined) {
      conteo[idx]++;
    }
  });

  // Devolver en el formato: { label, valor }
  return dias.map((label, i) => ({
    label,
    valor: conteo[i]
  }));
}

// 
function procesarMensual(registros) {
  const semanas = [0, 0, 0, 0];
  registros.forEach(r => {
    const fecha = new Date(r.updatedAt);
    const diaMes = fecha.getDate();
    const semana = Math.min(3, Math.ceil(diaMes / 7) - 1);
    semanas[semana]++;
  });
  return [
    { label: "Sem 1", valor: semanas[0] },
    { label: "Sem 2", valor: semanas[1] },
    { label: "Sem 3", valor: semanas[2] },
    { label: "Sem 4", valor: semanas[3] }
  ];
}

function procesarAnual(registros) {
  const meses = Array(12).fill(0);
  const nombres = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  registros.forEach(r => {
    const mes = new Date(r.updatedAt).getMonth();
    meses[mes]++;
  });
  return meses.map((valor, i) => ({ label: nombres[i], valor }));
}