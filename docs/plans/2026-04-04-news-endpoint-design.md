# Design: GET /news endpoint

**Date:** 2026-04-04  
**Status:** Approved

## Overview

Add a `GET /news` endpoint that fetches ~40 news articles from NewsAPI across 4 categories, uses a Groq LLM to select the 5 most relevant for an Argentine investor based on titles only, and returns those 5 articles as JSON with links.

This is a PoC — summaries are out of scope. The second LLM pass (markdown summaries) is a future enhancement.

## Architecture

Follows the existing controller/service pattern:

```
src/
  services/
    newsService.ts      ← NewsAPI queries (4 parallel, dedup by URL)
    groqService.ts      ← Groq LLM call to select top 5 indices
  controllers/
    newsController.ts   ← GET /news handler
  routes/
    tickerRoutes.ts     ← add /news route (existing file)
```

## Data Flow

```
GET /news
  → newsService: 4 parallel queries to NewsAPI
      • global market:     /v2/top-headlines?category=business&language=en&pageSize=10
      • argentina market:  /v2/everything?q=mercado+argentino+acciones&language=es&pageSize=10
      • geopolitics:       /v2/everything?q=geopolitics+war+diplomacy&pageSize=10
      • watchlist:         /v2/everything?q=YPF OR "Banco Galicia" OR Apple OR "S&P 500"&pageSize=10
  → deduplicate by URL → array of up to ~40 articles with `category` field
  → groqService: send numbered titles+category, ask for 5 indices as JSON array
  → return 5 selected articles
```

## Response Shape

```json
[
  {
    "title": "YPF anuncia nuevo contrato de exportación de GNL",
    "url": "https://...",
    "source": "Infobae",
    "publishedAt": "2026-04-04T14:00:00Z",
    "category": "watchlist"
  }
]
```

## Groq Prompt (first pass)

Titles are sent numbered with their category. The LLM is asked to respond **only** with a JSON array of 5 integers (indices).

```
Sos un analista financiero. Dado el siguiente listado de noticias,
seleccioná los 5 índices más relevantes para un inversor argentino.
Respondé únicamente con un array JSON de enteros, ej: [2, 7, 15, 23, 31]

0. [global] Fed signals rate hold amid inflation concerns
1. [argentina] Banco Galicia reporta resultados del Q1...
...
```

## Environment Variables

```
NEWS_API_KEY=...
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile
```

Groq is called via axios against the OpenAI-compatible endpoint (`https://api.groq.com/openai/v1/chat/completions`) — no extra SDK needed.

## Watchlist (hardcoded for PoC)

- YPF
- Banco Galicia
- Apple
- S&P 500

## Out of Scope (PoC)

- Markdown summaries (second LLM pass)
- Caching / rate limiting
- Dynamic watchlist from DB
