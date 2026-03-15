# Design: /manysave and /manyhistory endpoints

**Date:** 2026-03-15

## Context

The existing `/many` endpoint fetches current prices via the rava.com scraper and dollar rates from DolarAPI, but does not persist anything. This design adds price persistence and a historical query endpoint, reusing the existing scraper stack.

## New Endpoints

| Endpoint | Description |
|---|---|
| `GET /manysave` | Same response as `/many`, but saves price and dollar snapshots to MongoDB as a side effect |
| `GET /manyhistory/:date` | Same response format as `/many` but sourced from historical snapshots for the given date (`YYYY-MM-DD`). Returns `null` for tickers with no data on that date. |

## New Models

### `PriceSnapshot`

| Field | Type | Notes |
|---|---|---|
| `symbol` | string | Uppercase ticker symbol |
| `price` | number | Price in ARS from rava scraper |
| `priceMep` | number | `price / bolsa` dollar rate at time of snapshot |
| `source` | string | `"rava"` |
| `timestamp` | Date | Time the snapshot was saved |

Index: `(symbol, timestamp)`

### `DollarSnapshot`

| Field | Type | Notes |
|---|---|---|
| `oficial` | number | Average of buy/sell for tipo oficial |
| `blue` | number | Average of buy/sell for dólar blue |
| `bolsa` | number | Average of buy/sell for dólar bolsa (MEP) |
| `contadoconliqui` | number | Average of buy/sell for CCL |
| `timestamp` | Date | Time the snapshot was saved |

Index: `timestamp`

## Flow: GET /manysave

1. Fetch rava prices + DolarAPI in parallel (identical to `/many`)
2. Save one `DollarSnapshot` document
3. For each ticker, save one `PriceSnapshot` with `priceMep = price / bolsa`
4. Return the same response as `/many`

## Flow: GET /manyhistory/:date

1. Get all tickers from MongoDB
2. For each ticker, query `PriceSnapshot` for the last record where `timestamp` falls within the requested date (midnight to midnight, local or UTC consistently)
3. Query `DollarSnapshot` for the last record within the requested date
4. Return in the same format as `/many`, with `null` values where no snapshot exists for a ticker on that date

## Files to Create/Modify

- `src/models/PriceSnapshot.ts` — new model
- `src/models/DollarSnapshot.ts` — new model
- `src/services/snapshotService.ts` — save and query snapshots
- `src/controllers/tickerController.ts` — add `manySave()` and `manyHistory()` handlers
- `src/routes/tickerRoutes.ts` — add `GET /manysave` and `GET /manyhistory/:date`
