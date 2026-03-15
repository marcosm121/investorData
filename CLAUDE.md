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

### GET /manysave
Same as `/many` + persists `PriceSnapshot` (one per ticker) and one `DollarSnapshot` to MongoDB.

**Response:** Array of ticker objects with current price data and exchange rates.

**Side effects:** Saves snapshots for price history tracking.

### GET /manyhistory/:date
Returns price and rate data for a given date in the same format as `/many`.

**Parameters:**
- `date` (path parameter) — Date in `YYYY-MM-DD` format (UTC)

**Response:** Array of ticker objects with historical price data for the specified date. Returns `null` for tickers or rates with no data on that date.

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
