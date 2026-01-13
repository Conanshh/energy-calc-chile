export interface SimulacionTramo {
  tramo: string;
  tarifa_unitario: number;
  costo_solo_dispositivo: number;
  total_estimado_con_cargo_fijo: number;
}

export interface GrupoDistribuidora {
  distribuidora: string;
  cargo_fijo: number;
  simulacion: SimulacionTramo[];
}

export interface RespuestaCalculo {
  meta: {
    comuna: string;
    ultima_actualizacion: string;
  };
  dispositivo: {
    potencia_watts: number;
    consumo_total_mes_kwh: number;
  };
  grupos: GrupoDistribuidora[];
}