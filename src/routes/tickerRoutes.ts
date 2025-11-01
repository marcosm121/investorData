import { Router } from "express";
import { TickerController } from "../controllers/tickerController";

const router = Router();
const tickerController = new TickerController();

// GET /many - Obtiene todos los tickers con precios
router.get("/many", tickerController.getMany);

// GET /manycsv - Obtiene todos los tickers con precios en formato csv
router.get("/manycsv", tickerController.getManyCsv);

// POST /add - Agrega un nuevo ticker
router.post("/add", tickerController.addTicker);

// POST /remove - Remueve un ticker
router.post("/remove", tickerController.removeTicker);

export default router;
