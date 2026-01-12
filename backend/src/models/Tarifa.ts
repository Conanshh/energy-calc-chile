export interface TarifaScrapeada {
  rango_texto: string;
  valor_kwh: number;
}

export interface GrupoDistribucion {
  distribuidora: string;
  cargoFijo: number;
  tarifas: TarifaScrapeada[];
}

export type ResultadoScraping = GrupoDistribucion[];