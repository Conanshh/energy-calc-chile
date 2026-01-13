import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tarifasRoutes from './routes/tarifas.routes.js';

dotenv.config();

const app = express();
// Middlewares
// CONFIGURACIÓN DE CORS PROFESIONAL
app.use(cors({
  origin: [
    'http://localhost:4200', // Para cuando pruebes en tu PC
    /\.vercel\.app$/          // Permite cualquier subdominio de Vercel (donde estará tu frontend)
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('🚀 API de Calculadora Energética Chile - Operacional');
});

// Montar Rutas
// Todas las rutas dentro de tarifasRoutes empezarán con /api/tarifas
app.use('/api/tarifas', tarifasRoutes);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0' , () => {
  console.log(`⚡ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🌍 Acceso universal habilitado en 0.0.0.0`);
});