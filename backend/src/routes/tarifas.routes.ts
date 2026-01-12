import { Router } from 'express';
import { calcularConsumoDispositivo } from '../services/tarifas.service.js';

const router = Router();

/**
 * RUTA: GET /api/tarifas/calcular
 * Descripción: Calcula el costo mensual de un dispositivo específico.
 */
router.get('/calcular', async (req, res) => {
  try {
    const comuna = String(req.query.comuna || '').trim();
    const watts = Number(req.query.watts);
    const horas = Number(req.query.horas);
    const dias = Number(req.query.dias);

    // Validaciones básicas de seguridad
    if (!comuna || isNaN(watts) || isNaN(horas) || isNaN(dias)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Faltan parámetros o son inválidos (comuna, watts, horas, dias)' 
      });
    }

    const resultado = await calcularConsumoDispositivo(comuna, watts, horas, dias);
    res.json({ success: true, data: resultado });

  } catch (error: any) {
    console.error('❌ Error en Route /calcular:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;