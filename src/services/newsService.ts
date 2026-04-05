import axios from 'axios';

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  category: 'global' | 'argentina' | 'geopolitics' | 'watchlist';
}

const BASE_URL = 'https://newsapi.org/v2';
const API_KEY = process.env.NEWS_API_KEY;

type Category = NewsArticle['category'];

async function fetchCategory(params: Record<string, string>, category: Category): Promise<NewsArticle[]> {
  const response = await axios.get(BASE_URL + (params.endpoint ?? '/everything'), {
    params: {
      apiKey: API_KEY,
      pageSize: 10,
      ...params,
      endpoint: undefined,
    },
  });
  return (response.data.articles ?? []).map((a: any) => ({
    title: a.title,
    url: a.url,
    source: a.source?.name ?? '',
    publishedAt: a.publishedAt,
    category,
  }));
}

export async function fetchAllNews(): Promise<NewsArticle[]> {
  const results = await Promise.allSettled([
    fetchCategory({ endpoint: '/top-headlines', category: 'business', language: 'en' }, 'global'),
    fetchCategory({ q: 'mercado argentino acciones bolsa', language: 'es' }, 'argentina'),
    fetchCategory({ q: 'geopolitics war diplomacy sanctions', language: 'en' }, 'geopolitics'),
    fetchCategory({ q: 'YPF OR "Banco Galicia" OR Apple OR "S&P 500"' }, 'watchlist'),
  ]);

  const all = results.flatMap(r => {
    if (r.status === 'rejected') {
      console.error('NewsAPI category fetch failed:', r.reason);
      return [];
    }
    return r.value;
  });

  // Deduplicate by URL, filter out articles with null titles
  const seen = new Set<string>();
  return all.filter(article => {
    if (!article.title || !article.url || seen.has(article.url)) return false;
    seen.add(article.url);
    return true;
  });
}
