import { Router } from 'express';
import { TickerController } from '../controllers/tickerController';

const router = Router();
const tickerController = new TickerController();

// GET /many - Obtiene todos los tickers con precios
router.get('/many', tickerController.getMany);

// POST /add - Agrega un nuevo ticker
router.post('/add', tickerController.addTicker);

// POST /remove - Remueve un ticker
router.post('/remove', tickerController.removeTicker);

export default router;
