import { Router } from "express";
import { TickerController } from "../controllers/tickerController";
import { NewsController } from "../controllers/newsController";

const router = Router();
const tickerController = new TickerController();
const newsController = new NewsController();

// GET /many - Obtiene todos los tickers con precios
router.get("/many", tickerController.getMany);

// GET /manycsv - Obtiene todos los tickers con precios en formato csv
router.get("/manycsv", tickerController.getManyCsv);

// GET /manyall - Obtiene todos los tickers con precios en ARS y USD (bolsa)
router.get("/manyall", tickerController.manyAll);

// GET /manysave - Obtiene todos los tickers con precios y guarda snapshots
router.get("/manysave", tickerController.manySave);

// GET /manyhistory/:date - Retorna datos históricos para una fecha YYYY-MM-DD
router.get("/manyhistory/:date", tickerController.manyHistory);

// POST /add - Agrega un nuevo ticker
router.post("/add", tickerController.addTicker);

// POST /remove - Remueve un ticker
router.post("/remove", tickerController.removeTicker);

// GET /news - Obtiene noticias curadas por LLM (cacheado 2hs)
router.get("/news", newsController.getNews);

// GET /resetnews - Limpia la caché de noticias
router.get("/resetnews", newsController.resetNews);

export default router;
