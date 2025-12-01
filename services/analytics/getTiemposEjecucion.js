import { Op } from "sequelize";
import { Registro } from "../../models/Registro.js";
import { TrazabilidadEnvio } from "../../models/TrazabilidadEnvio.js";
import { AutorizacionBot } from "../../models/AutorizacionBot.js";
import { RegistroGeneral } from "../../models/RegistroGeneral.js";

// Helper para mostrar nombre de mes
function obtenerNombreMes(idx) {
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return meses[idx];
}

export const getTiemposEjecucion = async (modo = "semanal", bot_id, maquina_id) => {

  // === FECHAS BASE ===
  const hoy = new Date();
  const añoActual = hoy.getFullYear();
  const mesActual = hoy.getMonth(); // 0-11

  // Rango mes actual
  const inicioMes = new Date(añoActual, mesActual, 1, 0, 0, 0);
  const finMes = new Date(añoActual, mesActual + 1, 0, 23, 59, 59);

  // Rango año completo
  const inicioAño = new Date(añoActual, 0, 1, 0, 0, 0);
  const finAño = new Date(añoActual, 11, 31, 23, 59, 59);

  // === CONFIG. DINÁMICA ===
  const botsRetiroUsuarios = [1, 2, 3];
  const botHistoriasClinicasId = 7;
  const botAutorizacionesId = 10;

  let modelo = Registro;
  let campoDuracion = "duracion";
  let filtroBase = {};

  if (bot_id) filtroBase.bot_id = bot_id;
  if (maquina_id) filtroBase.maquina_id = maquina_id;

  if (botsRetiroUsuarios.includes(Number(bot_id))) {
    modelo = Registro;
  } else if (Number(bot_id) === botHistoriasClinicasId) {
    modelo = TrazabilidadEnvio;
  } else if (Number(bot_id) === botAutorizacionesId) {
    modelo = AutorizacionBot;
  } else {
    modelo = RegistroGeneral;
  }

  // === RANGO SEGÚN MODO ===
  const whereRange = {};
  if (modo === "anual") {
    whereRange.updatedAt = { [Op.between]: [inicioAño, finAño] };
  } else {
    whereRange.updatedAt = { [Op.between]: [inicioMes, finMes] };
  }

  // === QUERY ===
  const registros = await modelo.findAll({
    where: {
      ...filtroBase,
      [campoDuracion]: { [Op.ne]: null },
      ...whereRange
    },
    attributes: [campoDuracion, "updatedAt"]
  });
  
  //SEMANAL → LUN, MAR, MIÉ, JUE, VIE, SÁB, DOM
  // ===========================================================
  function procesarSemanal(regs) {
    const dias = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
    const totales = Array(7).fill(0);
    const conteos = Array(7).fill(0);
    //console.log('regs: ',regs);
    
    regs.forEach(r => {
      const f = new Date(r.updatedAt);
      if (f.getMonth() !== mesActual) return;

      let d = f.getDay();  
      d = d === 0 ? 6 : d - 1; 

      totales[d] += Number(r[campoDuracion]) || 0;
      conteos[d]++;
    });

    return dias.map((d, i) => ({
      label: d,
      valor: conteos[i] ? totales[i] / conteos[i] : 0
    }));
  }

  // MENSUAL → SEM1, SEM2, SEM3, SEM4
  // ===========================================================
  function procesarMensual(regs) {
    const semanas = [[], [], [], []];

    regs.forEach(r => {
      const f = new Date(r.updatedAt);
      if (f.getMonth() !== mesActual) return;

      const dia = f.getDate();
      const idx = Math.min(3, Math.ceil(dia / 7) - 1);

      semanas[idx].push(Number(r[campoDuracion]) || 0);
    });

    return semanas.map((vals, i) => {
      const total = vals.reduce((a, b) => a + b, 0);
      const promedio = vals.length ? total / vals.length : 0;

      return {
        label: `Sem ${i + 1}`,
        valor: promedio
      };
    });
  }

  //ANUAL → ENE, FEB, MAR... DIC
  // ===========================================================
  function procesarAnual(regs) {
    const meses = Array.from({ length: 12 }, () => []);

    regs.forEach(r => {
      const f = new Date(r.updatedAt);
      const mes = f.getMonth();
      meses[mes].push(Number(r[campoDuracion]) || 0);
    });

    return meses.map((vals, idx) => {
      const total = vals.reduce((a, b) => a + b, 0);
      const promedio = vals.length ? total / vals.length : 0;

      return {
        label: obtenerNombreMes(idx),
        valor: promedio
      };
    });
  }

  //RETORNAR SEGÚN MODO
  // ===========================================================
  if (modo === "semanal") return { semanal: procesarSemanal(registros) };
  if (modo === "mensual") return { mensual: procesarMensual(registros) };
  if (modo === "anual") return { anual: procesarAnual(registros) };

  // modo inválido → devolver todo
  return {
    semanal: procesarSemanal(registros),
    mensual: procesarMensual(registros),
    anual: procesarAnual(registros)
  };
};
