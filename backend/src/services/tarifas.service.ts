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

  // 2. Revisar existencia y antigüedad en la DB
  const resComuna = await query(
    'SELECT id, ultima_actualizacion FROM comunas WHERE LOWER(nombre) = $1', 
    [lowerComuna]
  );

  let debeScrapear = false;

  if (resComuna.rows.length === 0) {
    // Si la comuna no existe en nuestra DB, hay que buscarla afuera
    debeScrapear = true;
  } else {
    // Si existe, revisamos qué tan vieja es la información.
    // Usamos 15 días de margen para dar prioridad a la DB sobre el scraping lento.
    const ultimaAct = new Date(resComuna.rows[0].ultima_actualizacion);
    const diffDias = (new Date().getTime() - ultimaAct.getTime()) / (1000 * 3600 * 24);
    
    if (diffDias > 15) {
      console.log(`⚠️ Datos de ${lowerComuna} antiguos (${Math.round(diffDias)} días). Actualizando...`);
      debeScrapear = true;
    }
  }

  // 3. Ejecutar Scraper solo si es estrictamente necesario
  if (debeScrapear) {
    try {
      console.log(`☁️ Iniciando scraping de emergencia para: ${lowerComuna}`);
      const scraped = await scrapeTarifas(comuna);
      
      if (scraped && scraped.length > 0) {
        await saveTarifasByComuna(comuna, scraped);
      } else {
        // Si el scraper falla pero tenemos datos viejos en la DB, los usamos igual
        if (resComuna.rows.length === 0) {
          throw new Error("No se pudo obtener datos y no hay registros previos.");
        }
        console.warn("Fallo el scraping, se usarán datos antiguos de la DB.");
      }
    } catch (error) {
      console.error("Error en proceso de scraping de rescate:", error);
      if (resComuna.rows.length === 0) throw error;
    }
  }

  // 4. Recuperar datos finales de la DB (lo que ya existía o lo recién guardado)
  const resData = await query(
    `SELECT t.rango_texto, t.valor_kwh, t.distribuidora, t.cargo_fijo, c.ultima_actualizacion 
     FROM tarifas t 
     JOIN comunas c ON t.comuna_id = c.id 
     WHERE LOWER(c.nombre) = $1`,
    [lowerComuna]
  );

  if (resData.rows.length === 0) {
    throw new Error("No se encontraron tarifas disponibles para esta comuna.");
  }

  // 5. Agrupar resultados por Distribuidora
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

  // 6. Retornar objeto final estructurado
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