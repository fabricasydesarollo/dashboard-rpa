import { Op } from "sequelize";
import { Registro } from "../../models/Registro.js";

// Servicio para obtener solicitudes de inactivación por rango de tiempo
export const getSolicitudesInactivacion = async (modo = "semanal") => {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = hoy.getMonth(); // 0-11

  let inicio, fin;

  if (modo === "semanal") {
  // SEMANA ACTUAL (lunes a domingo que contiene hoy)
  const diaSemana = hoy.getDay(); // 0 = dom, 1 = lun, ..., 6 = sáb
  // Calcular cuántos días restar para llegar al lunes de esta semana
  // Si hoy es lunes (1) → -0 días
  // Si hoy es martes (2) → -1 día
  // Si hoy es domingo (0) → -6 días
  const diasHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;

  inicio = new Date(hoy);
  inicio.setDate(hoy.getDate() + diasHastaLunes);
  inicio.setHours(0, 0, 0, 0);

  fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 6);
  fin.setHours(23, 59, 59, 999);
} else if (modo === "mensual") {
    inicio = new Date(año, mes, 1);
    fin = new Date(año, mes + 1, 0, 23, 59, 59);
  } else if (modo === "anual") {
    inicio = new Date(año, 0, 1);
    fin = new Date(año, 11, 31, 23, 59, 59);
  }

  // Traer registros en el rango
  const registros = await Registro.findAll({
    where: {
      fecha_ejecucion: { [Op.between]: [inicio, fin] }
    },
    attributes: ["id", "fecha_ejecucion"]
  });

  // Procesamiento según modo
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

// Procesamiento semanal → solo para 7 días consecutivos (lunes a domingo)
function procesarSemanal(registros, inicioSemana, finSemana) {
  const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const valores = Array(7).fill(0);

  // Generar mapa de fecha → índice (para evitar ambigüedad)
  const mapaFechas = {};
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(inicioSemana);
    fecha.setDate(inicioSemana.getDate() + i);
    const key = fecha.toISOString().split('T')[0]; // "YYYY-MM-DD"
    mapaFechas[key] = i;
  }

  // Contar por día real
  registros.forEach(r => {
    const fecha = new Date(r.fecha_ejecucion);
    const key = fecha.toISOString().split('T')[0];
    const idx = mapaFechas[key];
    if (idx !== undefined) {
      valores[idx]++;
    }
  });

  return { labels: dias, values: valores, };
}

// Procesamiento mensual (semanas 1 a 4+)
function procesarMensual(registros) {
  const semanas = [0, 0, 0, 0];

  registros.forEach(r => {
    const dia = new Date(r.fecha_ejecucion).getDate();
    const idx = Math.min(3, Math.ceil(dia / 7) - 1); // Sem 1: días 1-7, Sem 2: 8-14, etc.
    semanas[idx]++;
  });

  return { labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"], values: semanas };
}

// Procesamiento anual
function procesarAnual(registros) {
  const meses = Array(12).fill(0);
  const nombres = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  registros.forEach(r => {
    const mes = new Date(r.fecha_ejecucion).getMonth();
    meses[mes]++;
  });

  return { labels: nombres, values: meses };
}