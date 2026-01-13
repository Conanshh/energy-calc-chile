import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

// 1. MOCKS DE MÓDULOS EXTERNOS
// IMPORTANTE: vi.mock debe ir antes de las importaciones de las funciones que los usan
vi.mock('../database.js', () => ({ 
  query: vi.fn() 
}));

vi.mock('../scraper/tarifas.scraper.js', () => ({ 
  scrapeTarifas: vi.fn() 
}));

vi.mock('../repositories/tarifas.repository.js', () => ({ 
  saveTarifasByComuna: vi.fn() 
}));

// 2. IMPORTACIONES DE LÓGICA Y FUNCIONES MOCKEADAS
import { calcularConsumoDispositivo } from './tarifas.service.js';
import { query } from '../database.js';
import { scrapeTarifas } from '../scraper/tarifas.scraper.js';
import { saveTarifasByComuna } from '../repositories/tarifas.repository.js';

// 3. TIPADO DE MOCKS PARA VITEST
// Reemplazamos jest.MockedFunction por el tipo 'Mock' de Vitest
const mockedQuery = query as Mock;
const mockedScrape = scrapeTarifas as Mock;
const mockedSave = saveTarifasByComuna as Mock;

describe('tarifas.service - calcularConsumoDispositivo', () => {
  
  beforeEach(() => {
    // Limpia el historial de llamadas entre cada test para evitar interferencias
    vi.clearAllMocks();
  });

  it('calcula correctamente cuando hay datos en la base de datos', async () => {
    // Simular que la comuna ya existe en la DB
    mockedQuery.mockResolvedValueOnce({ 
      rows: [{ id: 1, ultima_actualizacion: new Date().toISOString() }] 
    });

    // Simular la devolución de las tarifas
    mockedQuery.mockResolvedValueOnce({ 
      rows: [
        { 
          rango_texto: 'Consumo Base', 
          valor_kwh: 100, 
          distribuidora: 'CGE', 
          cargo_fijo: 1000, 
          ultima_actualizacion: new Date().toISOString() 
        }
      ] 
    });

    const res = await calcularConsumoDispositivo('Algarrobo', 1000, 1, 1);

    // Verificaciones (Assertions)
    expect(res.meta.comuna).toBe('ALGARROBO');
    expect(res.dispositivo.consumo_total_mes_kwh).toBe(1);
    expect(res.grupos[0].simulacion[0].costo_solo_dispositivo).toBe(100);
  });

  it('lanza errores de validación para parámetros fuera de rango', async () => {
    // Prueba de horas inválidas (> 24)
    await expect(() => calcularConsumoDispositivo('Santiago', 100, 25, 1)).rejects.toThrow();
    // Prueba de watts inválidos (<= 0)
    await expect(() => calcularConsumoDispositivo('Santiago', 0, 1, 1)).rejects.toThrow();
    // Prueba de días inválidos (> 31)
    await expect(() => calcularConsumoDispositivo('Santiago', 100, 1, 32)).rejects.toThrow();
  });

  it('cuando no existe la comuna, ejecuta el scraping y guarda los datos nuevos', async () => {
    // Simular que la comuna NO existe (query devuelve vacío)
    mockedQuery.mockResolvedValueOnce({ rows: [] });

    // Simular que el scraper encuentra los datos en la web de la SEC/Enel
    mockedScrape.mockResolvedValueOnce([
      { rango_texto: 'Consumo Base', valor_kwh: 50, distribuidora: 'EDEL', cargo_fijo: 800 }
    ]);

    // Simular la consulta final después de haber guardado los datos
    mockedQuery.mockResolvedValueOnce({ 
      rows: [
        { 
          rango_texto: 'Consumo Base', 
          valor_kwh: 50, 
          distribuidora: 'EDEL', 
          cargo_fijo: 800, 
          ultima_actualizacion: new Date().toISOString() 
        }
      ] 
    });

    const res = await calcularConsumoDispositivo('ComunaNueva', 1000, 1, 1);

    // Verificar que se llamaron a los procesos de actualización
    expect(mockedScrape).toHaveBeenCalled();
    expect(mockedSave).toHaveBeenCalled();
    expect(res.grupos[0].distribuidora).toBe('EDEL');
  });

  it('maneja múltiples distribuidoras (3+) correctamente', async () => {
    // 1. Comuna existe
    mockedQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    // 2. Simulamos 3 empresas distintas en la misma comuna
    mockedQuery.mockResolvedValueOnce({ 
      rows: [
        { distribuidora: 'ENEL', cargo_fijo: 1000, valor_kwh: 110, rango_texto: 'BT1' },
        { distribuidora: 'CGE', cargo_fijo: 1200, valor_kwh: 115, rango_texto: 'BT1' },
        { distribuidora: 'CHILQUINTA', cargo_fijo: 1100, valor_kwh: 105, rango_texto: 'BT1' }
      ] 
    });

    const res = await calcularConsumoDispositivo('Colina', 1000, 1, 1);

    // Verificamos que se crearon 3 grupos independientes
    expect(res.grupos).toHaveLength(3);
    
    // Verificamos que los nombres coincidan
    const nombresEmpresas = res.grupos.map(g => g.distribuidora);
    expect(nombresEmpresas).toContain('ENEL');
    expect(nombresEmpresas).toContain('CGE');
    expect(nombresEmpresas).toContain('CHILQUINTA');
  });
});