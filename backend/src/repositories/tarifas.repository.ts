import { query } from '../database.js';
import { type ResultadoScraping } from '../models/Tarifa.js';

export const saveTarifasByComuna = async (comuna: string, grupos: ResultadoScraping) => {
  try {
    const nombreLimpio = comuna.trim().toLowerCase();

    // 1. Insertar/Actualizar Comuna
    const comRes = await query(
      `INSERT INTO comunas (nombre, ultima_actualizacion) 
       VALUES ($1, CURRENT_TIMESTAMP) 
       ON CONFLICT (nombre) DO UPDATE SET ultima_actualizacion = CURRENT_TIMESTAMP 
       RETURNING id`,
      [nombreLimpio]
    );
    const comunaId = comRes.rows[0].id;

    // 2. Limpiar tarifas anteriores para evitar duplicados o basura
    await query('DELETE FROM tarifas WHERE comuna_id = $1', [comunaId]);

    // 3. Insertar cada grupo de distribuidora
    for (const grupo of grupos) {
      for (const t of grupo.tarifas) {
        await query(
          `INSERT INTO tarifas (comuna_id, rango_texto, valor_kwh, cargo_fijo, distribuidora) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            comunaId,           // $1
            t.rango_texto,      // $2
            t.valor_kwh,        // $3
            grupo.cargoFijo,    // $4 (Numérico)
            grupo.distribuidora // $5 (Texto)
          ]
        );
      }
    }
    
    console.log(`💾 [DB] Guardado exitoso: ${nombreLimpio} (${grupos.length} empresas)`);
    return true;
  } catch (error) {
    console.error('❌ [DB ERROR] Error al guardar tarifas:', error);
    throw error;
  }
};