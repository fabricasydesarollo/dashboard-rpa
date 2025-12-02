import { Op, fn, col } from "sequelize";
import { Registro } from "../../models/Registro.js";

// Servicio para obtener solicitudes de inactivación por rango de tiempo
export const getSolicitudesInactivacion = async (modo = "semanal") => {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = hoy.getMonth(); // 0-11

  let inicio, fin;

  if (modo === "semanal" || modo === "mensual") {
    // Rango mes actual
    inicio = new Date(año, mes, 1, 0, 0, 0);
    fin = new Date(año, mes + 1, 0, 23, 59, 59);
  } else {
    // Anual
    inicio = new Date(año, 0, 1, 0, 0, 0);
    fin = new Date(año, 11, 31, 23, 59, 59);
  }

  // Traer todos los registros del rango
  const registros = await Registro.findAll({
    where: {
      fecha_ejecucion: { [Op.between]: [inicio, fin] }
    },
    attributes: ["id", "fecha_ejecucion"]
  });

  // Procesamiento según modo
  switch (modo) {
    case "semanal":
      return { semanal: procesarSemanal(registros) };
    case "mensual":
      return { mensual: procesarMensual(registros) };
    case "anual":
      return { anual: procesarAnual(registros) };
    default:
      return { error: "Modo inválido" };
  }
};

// Procesamiento semanal
function procesarSemanal(registros) {
  const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const valores = Array(7).fill(0);

  registros.forEach(r => {
    const fecha = new Date(r.fecha_ejecucion);
    let dia = fecha.getDay(); // 0 = domingo
    dia = dia === 0 ? 6 : dia - 1; // lunes = 0
    valores[dia]++;
  });

  return { labels: dias, values: valores };
}

// Procesamiento mensual (semanas 1 a 4)
function procesarMensual(registros) {
  const semanas = [0, 0, 0, 0];

  registros.forEach(r => {
    const dia = new Date(r.fecha_ejecucion).getDate();
    const idx = Math.min(3, Math.ceil(dia / 7) - 1);
    semanas[idx]++;
  });

  return {
    labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
    values: semanas
  };
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
