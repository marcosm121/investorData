# investorData

A TypeScript/Express/Mongoose backend for Argentine investment data.

## Endpoints

### GET /many
Returns all tickers with current prices and dollar rates.

**Response:** Array of ticker objects with current price data and exchange rates.

### GET /manycsv
Same as `/many` but in CSV format.

**Response:** CSV-formatted data with headers and ticker rows.

### POST /add
Adds a new ticker to the database.

**Request body:**
```json
{
  "symbol": "AAPL"
}
```

### POST /remove
Removes a ticker from the database.

**Request body:**
```json
{
  "symbol": "AAPL"
}
```

### GET /manyall
Same as `/many` but tickers return `{ ars: number, usd: number }` instead of a flat number. Dollar rates remain flat numbers. `usd = ars / bolsa`, rounded to 4 decimals.

### GET /manysave
Same as `/many` + persists `PriceSnapshot` (one per ticker) and one `DollarSnapshot` to MongoDB.

**Side effects:** Saves snapshots for price history tracking.

### GET /news
Returns 5 curated news articles selected by LLM as most relevant for an Argentine investor.

**Response:** Array of 5 article objects.

```json
[
  {
    "title": "string",
    "url": "string",
    "source": "string",
    "publishedAt": "ISO 8601 string",
    "category": "global | argentina | geopolitics | watchlist",
    "summary": "markdown string (H3 + 2-3 paragraphs, max ~150 words)"
  }
]
```

**Blacklists:**
- Source blacklist (filtered before LLM selection): `Yahoo Entertainment`
- Jina domain blacklist (skips content extraction): `apnews.com`

**Implementation:** Fetches ~40 articles from NewsAPI across 4 categories in parallel, deduplicates by URL, passes titles to Groq LLM to select top 5 indices.

**Required env vars:** `NEWS_API_KEY`, `GROQ_API_KEY`, `GROQ_MODEL` (default: `llama-3.3-70b-versatile`)

**Watchlist (hardcoded PoC):** YPF, Banco Galicia, Apple, S&P 500

### GET /manyhistory/:date
Returns historical price data for a given date in the same format as `/manyall`.

**Parameters:**
- `date` (path parameter) — Date in `YYYY-MM-DD` format (UTC)

**Response:** Tickers return `{ ars: number | null, usd: number | null }`. Dollar rates return flat numbers or `null` if no data for that date.

## Snapshot Persistence

### PriceSnapshot
Stores historical price snapshots for tickers.

**Schema:** `{ symbol, price, priceMep, source, timestamp }`

**Index:** `(symbol, timestamp desc)`

**Notes:**
- `priceMep = price / bolsa` (computed at save time)

### DollarSnapshot
Stores historical exchange rate snapshots.

**Schema:** `{ oficial, blue, bolsa, contadoconliqui, timestamp }`

**Index:** `timestamp desc`

**Notes:**
- Dates in `/manyhistory` are treated as UTC days

## Models

The project uses Mongoose with the following models:

- `PriceSnapshot` — Historical ticker prices
- `DollarSnapshot` — Historical exchange rates
