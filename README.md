# ⚡ Simulador de Consumo Eléctrico - Chile

Aplicación Fullstack para estimar el gasto mensual de dispositivos eléctricos en pesos chilenos ($), considerando tarifas reales por comuna, cargos fijos y tramos de consumo del mercado eléctrico chileno.

## 🚀 Tecnologías utilizadas

- Frontend: Angular 19+ (Signals, Standalone Components).
- Backend: NestJS / Node.js.
- Estilos: CSS3 moderno (responsive, animaciones y validaciones).
- Gestión de versiones: Git / GitHub.

---

## 🛠️ Instalación y configuración

Clona el repositorio y arranca los servicios (Windows):

```bash
git clone https://github.com/Conanshh/energy-calc-chile.git
cd energy-calc-chile
```

Backend (NestJS):

```bash
cd backend
npm install
npm run start:dev
```

Frontend (Angular):

```bash
cd ../frontend
npm install
npm start
```

La aplicación frontend por defecto estará disponible en: http://localhost:4200

---

## 📖 Documentación de la API

Endpoint principal para la simulación tarifaria.

GET /api/tarifas/calcular

Parámetros de consulta (query params):

| Parámetro | Tipo   | Requerido | Descripción                                |
|-----------|--------|-----------|--------------------------------------------|
| comuna    | string | Sí        | Nombre de la comuna (ej: "Algarrobo")      |
| watts     | number | Sí        | Potencia del equipo en Watts (> 0)         |
| horas     | number | Sí        | Horas de uso diario (1 - 24)               |
| dias      | number | Sí        | Días de uso al mes (1 - 31)                |

Validaciones:
- Watts: numérico > 0.
- Horas: entero entre 1 y 24.
- Días: entero entre 1 y 31.

En caso de datos inválidos la API retorna 400 Bad Request con detalle del error.

### Ejemplo de respuesta exitosa (JSON)

```json
{
  "data": {
    "meta": {
      "comuna": "Algarrobo",
      "ultima_actualizacion": "2026-01-12"
    },
    "dispositivo": {
      "potencia_watts": 1500,
      "consumo_total_mes_kwh": 45.5
    },
    "grupos": [
      {
        "distribuidora": "CGE",
        "cargo_fijo": 1250,
        "simulacion": [
          {
            "tramo": "Consumo Base",
            "tarifa_unitario": 145.2,
            "costo_solo_dispositivo": 6606,
            "total_estimado_con_cargo_fijo": 7856
          }
        ]
      }
    ]
  }
}
```

---

## 🧮 Lógica de cálculo aplicada

Consumo de energía mensual:
kWh = (Watts × Horas × Días) / 1000

Costo variable por tramo: consumo (kWh) × tarifa unitaria ($/kWh) de la distribuidora asociada a la comuna.

Costo final estimado: costo de consumo del dispositivo + cargo fijo mensual de la distribuidora.

---

## 🛡️ Blindaje de datos y manejo de errores

- Validaciones en frontend y backend.
- Respuestas claras con códigos HTTP adecuados (400 para entradas inválidas).
- Mensajes de error mostrados en UI mediante banners/alertas.

---

## 📝 Licencia

Proyecto bajo licencia MIT — uso, modificación y distribución libres con preservación de la autoría.

Proyecto desarrollado como simulador técnico de tarifas eléctricas para el mercado chileno.
// ...existing code...