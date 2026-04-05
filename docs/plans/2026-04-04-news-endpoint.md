# /news Endpoint Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `GET /news` that fetches ~40 articles from NewsAPI across 4 categories, uses Groq LLM to select the 5 most relevant for an Argentine investor, and returns them as JSON with links.

**Architecture:** `NewsService` handles 4 parallel NewsAPI queries + dedup. `GroqService` sends numbered titles to the LLM and parses back 5 indices. `NewsController` wires them together. No caching, no summaries — PoC only.

**Tech Stack:** TypeScript, Express, axios (already installed), NewsAPI REST, Groq OpenAI-compatible API

---

### Task 1: Add env variables

**Files:**
- Modify: `.env`

**Step 1: Add the two new keys**

Append to `.env`:
```
GROQ_API_KEY=<your-groq-key>
GROQ_MODEL=llama-3.3-70b-versatile
```

Note: `NEWS_API` already exists in `.env` — keep that name, we'll use it as-is.

**Step 2: Verify**

Run the server (`npm run dev`) and confirm it starts without errors.

**Step 3: Commit**

```bash
git add .env
git commit -m "chore: add Groq env vars for news endpoint"
```

---

### Task 2: Create NewsService

**Files:**
- Create: `src/services/newsService.ts`

**Step 1: Write the service**

```typescript
import axios from 'axios';

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  category: 'global' | 'argentina' | 'geopolitics' | 'watchlist';
}

const BASE_URL = 'https://newsapi.org/v2';
const API_KEY = process.env.NEWS_API;

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
  const [global, argentina, geopolitics, watchlist] = await Promise.all([
    fetchCategory({ endpoint: '/top-headlines', category: 'business', language: 'en' }, 'global'),
    fetchCategory({ q: 'mercado argentino acciones bolsa', language: 'es' }, 'argentina'),
    fetchCategory({ q: 'geopolitics war diplomacy sanctions', language: 'en' }, 'geopolitics'),
    fetchCategory({ q: 'YPF OR "Banco Galicia" OR Apple OR "S&P 500"' }, 'watchlist'),
  ]);

  const all = [...global, ...argentina, ...geopolitics, ...watchlist];

  // Deduplicate by URL
  const seen = new Set<string>();
  return all.filter(article => {
    if (!article.url || seen.has(article.url)) return false;
    seen.add(article.url);
    return true;
  });
}
```

**Step 2: Smoke-test manually**

Add a temporary `console.log` call in `src/index.ts` startup to call `fetchAllNews()` and log the count, then run `npm run dev`. Confirm you get 20–40 articles. Remove the temp log after.

**Step 3: Commit**

```bash
git add src/services/newsService.ts
git commit -m "feat: add NewsService with 4-category NewsAPI queries"
```

---

### Task 3: Create GroqService

**Files:**
- Create: `src/services/groqService.ts`

**Step 1: Write the service**

```typescript
import axios from 'axios';
import { NewsArticle } from './newsService';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function selectTopArticles(articles: NewsArticle[]): Promise<NewsArticle[]> {
  const numbered = articles
    .map((a, i) => `${i}. [${a.category}] ${a.title}`)
    .join('\n');

  const prompt = `Sos un analista financiero. Dado el siguiente listado de noticias, seleccioná los 5 índices más relevantes para un inversor argentino. Respondé únicamente con un array JSON de enteros, sin texto adicional. Ejemplo: [2, 7, 15, 23, 31]\n\n${numbered}`;

  const response = await axios.post(
    GROQ_URL,
    {
      model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const content: string = response.data.choices[0].message.content.trim();

  // Parse the JSON array from the response
  const match = content.match(/\[[\d,\s]+\]/);
  if (!match) throw new Error(`Groq returned unexpected format: ${content}`);

  const indices: number[] = JSON.parse(match[0]);
  return indices
    .filter(i => i >= 0 && i < articles.length)
    .slice(0, 5)
    .map(i => articles[i]);
}
```

**Step 2: Smoke-test manually**

Temporarily call `selectTopArticles` in startup with a hardcoded dummy array of 10 articles and log the result. Confirm you get back 5. Remove after.

**Step 3: Commit**

```bash
git add src/services/groqService.ts
git commit -m "feat: add GroqService for LLM-based article selection"
```

---

### Task 4: Create NewsController

**Files:**
- Create: `src/controllers/newsController.ts`

**Step 1: Write the controller**

```typescript
import { Request, Response } from 'express';
import { fetchAllNews } from '../services/newsService';
import { selectTopArticles } from '../services/groqService';

export class NewsController {
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
```

**Step 2: Commit**

```bash
git add src/controllers/newsController.ts
git commit -m "feat: add NewsController for GET /news"
```

---

### Task 5: Wire up the route

**Files:**
- Modify: `src/routes/tickerRoutes.ts`

**Step 1: Add the import and route**

At the top of `tickerRoutes.ts`, add:
```typescript
import { NewsController } from '../controllers/newsController';
```

After `const tickerController = new TickerController();`, add:
```typescript
const newsController = new NewsController();
```

Add the route before the `export default`:
```typescript
// GET /news - Obtiene noticias curadas por LLM
router.get('/news', newsController.getNews);
```

**Step 2: Commit**

```bash
git add src/routes/tickerRoutes.ts
git commit -m "feat: register GET /news route"
```

---

### Task 6: End-to-end smoke test

**Step 1: Start the server**

```bash
npm run dev
```

**Step 2: Hit the endpoint**

```bash
curl http://localhost:3000/news
```

Expected: JSON array of 5 objects, each with `title`, `url`, `source`, `publishedAt`, `category`.

**Step 3: Check error cases**

- Set `NEWS_API` to an invalid value → should get 500 with a message
- Set `GROQ_API_KEY` to an invalid value → should get 500 with a message
- Restore correct values

**Step 4: Final commit if any fixes were made**

```bash
git add -p
git commit -m "fix: <describe what was fixed>"
```
