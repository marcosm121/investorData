import { Request, Response } from "express";
import { TickerService } from "../services/tickerService";
import { RavaScrapper } from "../services/ravaScrapper";
import { DolarAPI } from "../services/dolarApi";
import { SnapshotService } from "../services/snapshotService";

export class TickerController {
  private tickerService: TickerService;
  private ravaScrapper: RavaScrapper;
  private dolarAPI: DolarAPI;
  private snapshotService: SnapshotService;

  constructor() {
    this.tickerService = new TickerService();
    this.ravaScrapper = new RavaScrapper();
    this.dolarAPI = new DolarAPI();
    this.snapshotService = new SnapshotService();
  }

  /**
   * Funciones privadas
   */
  private async getData() {
    const tickers = await this.tickerService.getAllTickers();
    //   const prices_random = this.tickerService.generateRandomPrices(tickers);
    //   console.log("prices random:");
    //   console.log(prices_random);
    const prices = await this.ravaScrapper.getMany(tickers);
    //   console.log("prices rava:");
    //   console.log(prices);
    const dolares = await this.dolarAPI.getDolares([
      "oficial",
      "blue",
      "bolsa",
      "contadoconliqui",
    ]);
    const resultado = { ...prices, ...dolares };
    console.log(resultado);
    return resultado;
  }

  /**
   * GET /many - Obtiene todos los tickers con precios aleatorios
   */
  getMany = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.getData();
      res.status(200).json(data);
    } catch (error) {
      console.error("Error en getMany:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  /**
   * GET /manycsv - devuelve la info en csv
   */
  getManyCsv = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.getData();
      const dataFormateada = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          String(value).replace(/\./g, ","),
        ])
      );
      const headers = "Ticker;Valor\n";
      const rows = Object.entries(dataFormateada)
        .map(([ticker, valor]) => `${ticker};${valor}`)
        .join("\n");

      const csv = headers + rows;

      // Configurar headers para descarga de CSV
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=datos.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error en getManyCsv:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  /**
   * GET /manyall - Retorna precios en ARS y USD (bolsa) para todos los tickers
   */
  manyAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const tickers = await this.tickerService.getAllTickers();
      const [prices, dolares] = await Promise.all([
        this.ravaScrapper.getMany(tickers),
        this.dolarAPI.getDolares(['oficial', 'blue', 'bolsa', 'contadoconliqui']),
      ]);
      const bolsa = dolares['bolsa'] || 0;
      const result: Record<string, { ars: number; usd: number }> = {};
      for (const ticker of tickers) {
        const ars = parseFloat(prices[ticker]) || 0;
        result[ticker] = {
          ars,
          usd: bolsa > 0 ? parseFloat((ars / bolsa).toFixed(4)) : 0,
        };
      }
      res.status(200).json({ ...result, ...dolares });
    } catch (error) {
      console.error('Error en manyAll:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * GET /manysave - Igual que /many pero guarda snapshots en MongoDB
   */
  manySave = async (req: Request, res: Response): Promise<void> => {
    try {
      const tickers = await this.tickerService.getAllTickers();
      const [prices, dolares] = await Promise.all([
        this.ravaScrapper.getMany(tickers),
        this.dolarAPI.getDolares(['oficial', 'blue', 'bolsa', 'contadoconliqui']),
      ]);
      await this.snapshotService.saveSnapshots(tickers, prices, dolares);
      res.status(200).json({ ...prices, ...dolares });
    } catch (error) {
      console.error('Error en manySave:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * GET /manyhistory/:date - Retorna datos históricos para una fecha (YYYY-MM-DD)
   */
  manyHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { date } = req.params;

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400).json({
          error: 'Formato de fecha inválido',
          message: 'Usar formato YYYY-MM-DD, ej: 2026-03-15',
        });
        return;
      }

      const tickers = await this.tickerService.getAllTickers();
      const result = await this.snapshotService.getSnapshotsForDate(date, tickers);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error en manyHistory:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * POST /add - Agrega un nuevo ticker
   */
  addTicker = async (req: Request, res: Response): Promise<void> => {
    try {
      const { symbol } = req.body;

      if (!symbol || typeof symbol !== "string") {
        res.status(400).json({
          error: "Símbolo requerido",
          message:
            'El campo "symbol" es requerido y debe ser una cadena de texto',
        });
        return;
      }

      const newTicker = await this.tickerService.addTicker(symbol);

      res.status(201).json({
        message: `Ticker ${newTicker.symbol} agregado exitosamente`,
        ticker: {
          symbol: newTicker.symbol,
          createdAt: newTicker.createdAt,
        },
      });
    } catch (error) {
      console.error("Error en addTicker:", error);

      if (error instanceof Error && error.message.includes("ya existe")) {
        res.status(409).json({
          error: "Ticker duplicado",
          message: error.message,
        });
      } else {
        res.status(500).json({
          error: "Error interno del servidor",
          message: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }
  };

  /**
   * POST /remove - Remueve un ticker
   */
  removeTicker = async (req: Request, res: Response): Promise<void> => {
    try {
      const { symbol } = req.body;

      if (!symbol || typeof symbol !== "string") {
        res.status(400).json({
          error: "Símbolo requerido",
          message:
            'El campo "symbol" es requerido y debe ser una cadena de texto',
        });
        return;
      }

      await this.tickerService.removeTicker(symbol);

      res.status(200).json({
        message: `Ticker ${symbol.toUpperCase()} removido exitosamente`,
      });
    } catch (error) {
      console.error("Error en removeTicker:", error);

      if (error instanceof Error && error.message.includes("no existe")) {
        res.status(404).json({
          error: "Ticker no encontrado",
          message: error.message,
        });
      } else {
        res.status(500).json({
          error: "Error interno del servidor",
          message: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }
  };
}
