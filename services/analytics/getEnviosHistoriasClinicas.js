import { Op } from 'sequelize';
import { TrazabilidadEnvio } from '../../models/TrazabilidadEnvio.js';

const botHistoriasClinicasId = 7;

export const getEnviosHistoriasClinicas = async (modo) => {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = hoy.getMonth(); // 0–11

  let inicio, fin;

  if (modo === "semanal" || modo === "mensual") {
    // Rango del mes actual
    inicio = new Date(año, mes, 1, 0, 0, 0);
    fin = new Date(año, mes + 1, 0, 23, 59, 59);
  } else {
    // ANUAL
    inicio = new Date(año, 0, 1, 0, 0, 0);
    fin = new Date(año, 11, 31, 23, 59, 59);
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
      return { semanal: procesarSemanal(registros) };

    case "mensual":
      return { mensual: procesarMensual(registros) };

    case "anual":
      return { anual: procesarAnual(registros) };

    default:
      return { error: "Modo inválido" };
  }
};

function procesarSemanal(registros) {
  const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const conteo = Array(7).fill(0);

  registros.forEach(r => {
    const fecha = new Date(r.updatedAt);
    let dia = fecha.getDay(); // 0=Dom → 6=Sab

    // Convertir para que Lunes sea 0
    dia = dia === 0 ? 6 : dia - 1;

    conteo[dia]++;
  });

  return dias.map((d, i) => ({
    label: d,
    valor: conteo[i]
  }));
}

function procesarMensual(registros) {
  const semanas = [0, 0, 0, 0];

  registros.forEach(r => {
    const fecha = new Date(r.updatedAt);
    const diaMes = fecha.getDate();

    const semana = Math.ceil(diaMes / 7) - 1; // 0–3

    if (semanas[semana] !== undefined) {
      semanas[semana]++;
    }
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
    const fecha = new Date(r.updatedAt);
    const mes = fecha.getMonth();
    meses[mes]++;
  });

  return meses.map((v, i) => ({
    label: nombres[i],
    valor: v
  }));
}
