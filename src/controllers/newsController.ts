import { Request, Response } from 'express';
import { fetchAllNews } from '../services/newsService';
import { selectTopArticles } from '../services/groqService';

export class NewsController {
  /**
   * GET /news - Retorna las 5 noticias más relevantes seleccionadas por LLM
   */
  getNews = async (req: Request, res: Response): Promise<void> => {
    try {
      const articles = await fetchAllNews();
      const top = await selectTopArticles(articles);
      res.status(200).json(top);
    } catch (error) {
      console.error('Error en getNews:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };
}
