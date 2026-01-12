import { query } from '../database.js';
import { scrapeTarifas } from '../scraper/tarifas.scraper.js';
import { saveTarifasByComuna } from '../repositories/tarifas.repository.js';

export const calcularConsumoDispositivo = async (
  comuna: string, 
  watts: number, 
  horasPorDia: number, 
  diasMes: number
) => {
  // 1. Validaciones de Negocio
  if (diasMes > 31) throw new Error("Días no pueden ser > 31.");
  if (horasPorDia > 24 || horasPorDia <= 0) throw new Error("Horas no pueden ser > 24.");
  if (watts <= 0) throw new Error("Watts debe ser positivo.");

  const consumoMensualKwh = (watts * horasPorDia * diasMes) / 1000;
  const lowerComuna = comuna.trim().toLowerCase();

  // 2. Revisar existencia y antigüedad
  const resComuna = await query(
    'SELECT id, ultima_actualizacion FROM comunas WHERE LOWER(nombre) = $1', 
    [lowerComuna]
  );

  let debeScrapear = false;
  if (resComuna.rows.length === 0) {
    debeScrapear = true;
  } else {
    const ultimaAct = new Date(resComuna.rows[0].ultima_actualizacion);
    const diffDias = (new Date().getTime() - ultimaAct.getTime()) / (1000 * 3600 * 24);
    if (diffDias > 7) debeScrapear = true;
  }

  // 3. Scrapear si es necesario
  if (debeScrapear) {
    const scraped = await scrapeTarifas(comuna);
    if (!scraped || scraped.length === 0) throw new Error("No se pudo obtener datos del sitio externo.");
    await saveTarifasByComuna(comuna, scraped);
  }

  // 4. Recuperar datos de DB (JOIN total para asegurar que leemos lo recién guardado)
  const resData = await query(
    `SELECT t.rango_texto, t.valor_kwh, t.distribuidora, t.cargo_fijo, c.ultima_actualizacion 
     FROM tarifas t 
     JOIN comunas c ON t.comuna_id = c.id 
     WHERE LOWER(c.nombre) = $1`,
    [lowerComuna]
  );

  if (resData.rows.length === 0) {
    throw new Error("No se encontraron tarifas para esta comuna tras el procesamiento.");
  }

  // 5. Agrupar por Distribuidora
  const gruposMap = new Map();

  resData.rows.forEach(row => {
    const nombreDist = row.distribuidora || 'Distribuidora Genérica';
    
    if (!gruposMap.has(nombreDist)) {
      gruposMap.set(nombreDist, {
        distribuidora: nombreDist,
        cargo_fijo: Number(row.cargo_fijo),
        simulacion: []
      });
    }

    const valorUnitario = Number(row.valor_kwh);
    const costoVariable = consumoMensualKwh * valorUnitario;

    gruposMap.get(nombreDist).simulacion.push({
      tramo: row.rango_texto,
      tarifa_unitario: valorUnitario,
      costo_solo_dispositivo: Math.round(costoVariable),
      total_estimado_con_cargo_fijo: Math.round(costoVariable + Number(row.cargo_fijo))
    });
  });

  return {
    meta: {
      comuna: comuna.toUpperCase(),
      ultima_actualizacion: resData.rows[0].ultima_actualizacion
    },
    dispositivo: {
      potencia_watts: watts,
      consumo_total_mes_kwh: Number(consumoMensualKwh.toFixed(2))
    },
    grupos: Array.from(gruposMap.values())
  };
};