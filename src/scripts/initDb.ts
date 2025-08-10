import { connectDatabase, disconnectDatabase } from '../config/database';
import { Ticker } from '../models/Ticker';

const initialTickers = [
  'YPFD', 'ALUA', 'TECO2', 'PAMP', 'TXAR', 'DESP', 'INTC', 'CRES', 'SUPV',
  'BPOD7', 'LOMA', 'BBV', 'TSLA', 'AL30', 'STLA', 'IWM', 'GLOB', 'NKE',
  'GGAL', 'MELI', 'CRM', 'NVDA', 'TEN', 'AL41', 'MSFT', 'SPY', 'AAPL', 'DISN'
];

async function initializeDatabase() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await connectDatabase();

    console.log('🧹 Limpiando base de datos existente...');
    await Ticker.deleteMany({});

    console.log('📝 Insertando tickers iniciales...');
    const tickerDocuments = initialTickers.map(symbol => ({ symbol }));
    await Ticker.insertMany(tickerDocuments);

    console.log(`✅ Base de datos inicializada con ${initialTickers.length} tickers`);
    console.log('📊 Tickers insertados:', initialTickers.join(', '));

    // Verificar la inserción
    const count = await Ticker.countDocuments();
    console.log(`📈 Total de tickers en la base de datos: ${count}`);

  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
  } finally {
    await disconnectDatabase();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeDatabase();
}

export { initializeDatabase };
