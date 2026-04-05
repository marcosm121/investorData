import { Request, Response } from 'express';
import { fetchAllNews } from '../services/newsService';
import { selectTopArticles, summarizeArticle } from '../services/groqService';
import { fetchArticleContent } from '../services/jinaService';
import { NewsArticle } from '../services/newsService';

const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

type EnrichedArticle = NewsArticle & { summary: string };

let cache: { articles: EnrichedArticle[]; cachedAt: number } | null = null;

export class NewsController {
  /**
   * GET /news - Retorna las 5 noticias más relevantes seleccionadas por LLM (cacheado 2hs)
   */
  getNews = async (req: Request, res: Response): Promise<void> => {
    try {
      if (cache && Date.now() - cache.cachedAt < CACHE_TTL_MS) {
        res.status(200).json(cache.articles);
        return;
      }

      const articles = await fetchAllNews();
      if (articles.length === 0) throw new Error('No se pudieron obtener artículos de NewsAPI');
      const top = await selectTopArticles(articles);

      const enriched: EnrichedArticle[] = await Promise.all(
        top.map(async (article) => {
          const content = await fetchArticleContent(article);
          const summary = await summarizeArticle(article, content);
          return { ...article, summary };
        })
      );

      cache = { articles: enriched, cachedAt: Date.now() };
      res.status(200).json(enriched);
    } catch (error) {
      console.error('Error en getNews:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * GET /resetnews - Limpia la caché de noticias
   */
  resetNews = (req: Request, res: Response): void => {
    cache = null;
    res.status(200).json({ message: 'Caché de noticias limpiada' });
  };
}
