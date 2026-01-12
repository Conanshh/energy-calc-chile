import puppeteer from 'puppeteer';
import { type ResultadoScraping } from '../models/Tarifa.js';

export const scrapeTarifas = async (comuna: string): Promise<ResultadoScraping | null> => {
  console.log(`\n🚀 [SCRAPER] Iniciando proceso para: "${comuna}"`);
  
  const browser = await puppeteer.launch({ 
    headless: true, 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();

  try {
    // 1. Navegación al sitio base
    await page.goto('https://cuentadelaluz.cl/', { waitUntil: 'networkidle2', timeout: 60000 });

    // 2. Esperar al selector de comuna
    await page.waitForSelector('#comuna');

    // 3. Selección Inteligente (Limpia espacios del sitio como "Ancud ")
    await page.evaluate((nombreBuscado) => {
      const select = document.querySelector('#comuna') as HTMLSelectElement;
      const opciones = Array.from(select.options);
      
      const coincidencia = opciones.find(opt => 
        opt.text.trim().toLowerCase() === nombreBuscado.trim().toLowerCase()
      );

      if (coincidencia) {
        select.value = coincidencia.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        throw new Error(`Comuna "${nombreBuscado}" no encontrada en la lista.`);
      }
    }, comuna);

    // Pequeña pausa para que el sitio procese el cambio de comuna
    await new Promise(r => setTimeout(r, 1000));

    // 4. Ejecutar búsqueda
    console.log(`⏳ Click en #buttonSearch...`);
    await page.click('#buttonSearch');
    
    // 5. Esperar a que aparezcan los contenedores de las distribuidoras
    await page.waitForSelector('.epf-info-container', { timeout: 20000 });

    // 6. Extracción de datos multi-distribuidora
    const datosFinales = await page.evaluate(() => {
      // El cambio clave: Buscamos las tarjetas individuales, no el contenedor padre
      const tarjetas = Array.from(document.querySelectorAll('.info-card'));
      
      return tarjetas.map(tarjeta => {
        const filas = Array.from(tarjeta.querySelectorAll('.info-row'));
        
        let distribuidora = 'No informada';
        let cargoFijo = 0;
        let listaTarifas: any[] = [];

        filas.forEach(fila => {
          const htmlFila = fila as HTMLElement;
          const textoFila = htmlFila.innerText || '';
          const etiqueta = htmlFila.querySelector('strong')?.innerText || '';

          // A. Extraer nombre de la Empresa
          if (etiqueta.includes('Distribuidora')) {
            distribuidora = textoFila.split(':')[1]?.trim() || distribuidora;
          } 
          // B. Extraer Cargo Fijo
          else if (etiqueta.includes('Cargo Fijo')) {
            const valorRaw = htmlFila.querySelector('span')?.innerText || '0';
            const valorLimpio = valorRaw.replace('$', '').replace(/\./g, '').replace(',', '.').trim();
            cargoFijo = parseFloat(valorLimpio) || 0;
          }
          // C. Extraer Tarifas (kWh)
          else if (textoFila.includes('kWh') && textoFila.includes(':')) {
            const partes = textoFila.split(':');
            const rango = partes[0]?.trim() || '';
            const precioTexto = partes[1] || '';
            
            const precioRaw = precioTexto.replace('$', '').replace(/\./g, '').replace(',', '.').trim();
            const valorNumerico = parseFloat(precioRaw);

            if (rango && !isNaN(valorNumerico)) {
              listaTarifas.push({ 
                rango_texto: rango, 
                valor_kwh: valorNumerico 
              });
            }
          }
        });

        return { 
          distribuidora, 
          cargoFijo, 
          tarifas: listaTarifas 
        };
      });
    });

    console.log(`✨ [EXITO] ${datosFinales.length} distribuidora(s) encontrada(s) para: ${comuna}`);
    return datosFinales;

  } catch (error: any) {
    console.error(`❌ [ERROR] Scraper:`, error.message);
    return null;
  } finally {
    await browser.close();
  }
};