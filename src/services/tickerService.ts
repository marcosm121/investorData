import { Ticker, ITicker } from '../models/Ticker';

export interface StockPrice {
  [key: string]: string;
}

export class TickerService {
  
  /**
   * Obtiene todos los tickers de la base de datos
   */
  async getAllTickers(): Promise<string[]> {
    try {
      const tickers = await Ticker.find({}).select('symbol -_id');
      return tickers.map(ticker => ticker.symbol);
    } catch (error) {
      console.error('Error al obtener tickers:', error);
      throw new Error('Error al obtener tickers de la base de datos');
    }
  }

  /**
   * Agrega un nuevo ticker a la base de datos
   */
  async addTicker(symbol: string): Promise<ITicker> {
    try {
      const normalizedSymbol = symbol.toUpperCase().trim();
      
      // Verificar si el ticker ya existe
      const existingTicker = await Ticker.findOne({ symbol: normalizedSymbol });
      if (existingTicker) {
        throw new Error(`El ticker ${normalizedSymbol} ya existe`);
      }

      const newTicker = new Ticker({ symbol: normalizedSymbol });
      return await newTicker.save();
    } catch (error) {
      console.error('Error al agregar ticker:', error);
      throw error;
    }
  }

  /**
   * Remueve un ticker de la base de datos
   */
  async removeTicker(symbol: string): Promise<boolean> {
    try {
      const normalizedSymbol = symbol.toUpperCase().trim();
      
      const result = await Ticker.deleteOne({ symbol: normalizedSymbol });
      
      if (result.deletedCount === 0) {
        throw new Error(`El ticker ${normalizedSymbol} no existe`);
      }
      
      return true;
    } catch (error) {
      console.error('Error al remover ticker:', error);
      throw error;
    }
  }

  /**
   * Genera precios aleatorios para los tickers
   */
  generateRandomPrices(tickers: string[]): StockPrice {
    const prices: StockPrice = {};
    
    // Generar precios aleatorios para cada ticker
    tickers.forEach(ticker => {
      // Generar un precio aleatorio entre 100 y 150000
      const randomPrice = Math.floor(Math.random() * 149900) + 100;
      prices[ticker] = randomPrice.toString();
    });

    // Agregar los precios especiales del dólar
    prices['oficial'] = (Math.random() * 200 + 1200).toFixed(2);
    prices['blue'] = (Math.random() * 200 + 1200).toFixed(2);
    prices['bolsa'] = (Math.random() * 200 + 1200).toFixed(2);
    prices['contadoconliqui'] = (Math.random() * 200 + 1200).toFixed(2);

    return prices;
  }
}
