import { query } from '../database.js';
import { scrapeTarifas } from '../scraper/tarifas.scraper.js';
import { saveTarifasByComuna } from '../repositories/tarifas.repository.js';
import { COMUNAS_CHILE } from '../models/comunas.data.js'; 

const refreshAll = async () => {
  console.log('--- 🕒 INICIANDO REFRESCO SEMANAL DE TARIFAS ---');
  const errores = [];

  for (const comuna of COMUNAS_CHILE) {
    try {
      console.log(`\n🔎 Procesando: ${comuna}...`);
      
      const scraped = await scrapeTarifas(comuna);
      
      if (scraped && scraped.length > 0) {
        await saveTarifasByComuna(comuna, scraped);
        console.log(`✅ ${comuna} actualizada.`);
      } else {
        throw new Error(`Datos vacíos para ${comuna}`);
      }

      // IMPORTANTE: Pausa de 3 segundos entre comunas para no ser bloqueados
      // por el sitio web externo (anti-bot)
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error: any) {
      console.error(`❌ Error en ${comuna}: ${error.message}`);
      errores.push({ comuna, error: error.message });
    }
  }

  console.log('\n--- ✨ PROCESO FINALIZADO ---');
  console.log(`Resumen: ${COMUNAS_CHILE.length - errores.length} exitosas, ${errores.length} fallidas.`);
  
  if (errores.length > 0) {
    console.log('Listado de errores:', errores);
  }
  
  process.exit(0);
};

refreshAll();