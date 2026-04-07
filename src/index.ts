import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import tickerRoutes from './routes/tickerRoutes';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/', tickerRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta por defecto
app.get('/', (req, res) => {
  res.json({
    message: 'API de Datos de Inversiones',
    version: '1.0.0',
    endpoints: {
      'GET /many': 'Obtener todos los tickers con precios',
      'POST /add': 'Agregar un nuevo ticker',
      'POST /remove': 'Remover un ticker',
      'GET /health': 'Estado del servidor'
    }
  });
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe`
  });
});

// Inicializar servidor
const startServer = async () => {
  try {
    // Conectar a la base de datos
    await connectDatabase();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
      console.log(`📊 API de datos de inversiones lista`);
      console.log(`🔗 Endpoints disponibles:`);
      console.log(`   GET  http://localhost:${PORT}/many`);
      console.log(`   POST http://localhost:${PORT}/add`);
      console.log(`   POST http://localhost:${PORT}/remove`);
      console.log(`   GET  http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de señales de terminación
process.on('SIGINT', () => {
  console.log('\n🛑 Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

// Iniciar aplicación
startServer();
