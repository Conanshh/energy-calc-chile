import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tarifasRoutes from './routes/tarifas.routes.js';

dotenv.config();

const app = express();
// Middlewares
app.use(cors());
app.use(express.json());

// Montar Rutas
// Todas las rutas dentro de tarifasRoutes empezarán con /api/tarifas
app.use('/api/tarifas', tarifasRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`⚡ Servidor corriendo en http://localhost:${PORT}`);
});