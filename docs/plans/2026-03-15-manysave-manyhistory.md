# /manysave and /manyhistory Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `GET /manysave` (fetches prices via rava + saves snapshots to MongoDB) and `GET /manyhistory/:date` (returns same format as `/many` from historical snapshots).

**Architecture:** Two new Mongoose models (`PriceSnapshot`, `DollarSnapshot`), one new service (`SnapshotService`) for persistence and queries, two new handlers added to the existing `TickerController`, two new routes added to the existing router.

**Tech Stack:** TypeScript, Express, Mongoose, existing `RavaScrapper` + `DolarAPI` services.

---

### Task 1: Create `PriceSnapshot` model

**Files:**
- Create: `src/models/PriceSnapshot.ts`

**Step 1: Create the file**

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IPriceSnapshot extends Document {
  symbol: string;
  price: number;
  priceMep: number;
  source: string;
  timestamp: Date;
}

const PriceSnapshotSchema: Schema = new Schema({
  symbol:    { type: String, required: true, uppercase: true, trim: true },
  price:     { type: Number, required: true },
  priceMep:  { type: Number, required: true },
  source:    { type: String, required: true },
  timestamp: { type: Date, required: true },
}, { timestamps: false });

PriceSnapshotSchema.index({ symbol: 1, timestamp: -1 });

export const PriceSnapshot = mongoose.model<IPriceSnapshot>('PriceSnapshot', PriceSnapshotSchema);
```

**Step 2: Verify TypeScript compiles**

```bash
npm run build
```
Expected: no errors.

**Step 3: Commit**

```bash
git add src/models/PriceSnapshot.ts
git commit -m "feat: add PriceSnapshot model"
```

---

### Task 2: Create `DollarSnapshot` model

**Files:**
- Create: `src/models/DollarSnapshot.ts`

**Step 1: Create the file**

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IDollarSnapshot extends Document {
  oficial:          number;
  blue:             number;
  bolsa:            number;
  contadoconliqui:  number;
  timestamp:        Date;
}

const DollarSnapshotSchema: Schema = new Schema({
  oficial:         { type: Number, required: true },
  blue:            { type: Number, required: true },
  bolsa:           { type: Number, required: true },
  contadoconliqui: { type: Number, required: true },
  timestamp:       { type: Date, required: true },
}, { timestamps: false });

DollarSnapshotSchema.index({ timestamp: -1 });

export const DollarSnapshot = mongoose.model<IDollarSnapshot>('DollarSnapshot', DollarSnapshotSchema);
```

**Step 2: Verify TypeScript compiles**

```bash
npm run build
```
Expected: no errors.

**Step 3: Commit**

```bash
git add src/models/DollarSnapshot.ts
git commit -m "feat: add DollarSnapshot model"
```

---

### Task 3: Create `SnapshotService`

**Files:**
- Create: `src/services/snapshotService.ts`

**Step 1: Create the file**

```typescript
import { PriceSnapshot } from '../models/PriceSnapshot';
import { DollarSnapshot } from '../models/DollarSnapshot';

interface DolarRates {
  oficial: number;
  blue: number;
  bolsa: number;
  contadoconliqui: number;
  [key: string]: number;
}

export class SnapshotService {

  async saveSnapshots(
    tickers: string[],
    prices: Record<string, string>,
    dolares: DolarRates,
    timestamp: Date = new Date()
  ): Promise<void> {
    const bolsa = dolares['bolsa'] || 0;

    await DollarSnapshot.create({
      oficial:         dolares['oficial'],
      blue:            dolares['blue'],
      bolsa:           dolares['bolsa'],
      contadoconliqui: dolares['contadoconliqui'],
      timestamp,
    });

    const docs = tickers.map(symbol => {
      const price = parseFloat(prices[symbol]) || 0;
      return {
        symbol,
        price,
        priceMep: bolsa > 0 ? parseFloat((price / bolsa).toFixed(4)) : 0,
        source: 'rava',
        timestamp,
      };
    });

    await PriceSnapshot.insertMany(docs);
  }

  async getSnapshotsForDate(
    date: string,   // YYYY-MM-DD (treated as UTC day)
    tickers: string[]
  ): Promise<Record<string, number | null>> {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end   = new Date(`${date}T23:59:59.999Z`);

    const [priceSnapshots, dollarSnapshot] = await Promise.all([
      PriceSnapshot
        .find({ symbol: { $in: tickers }, timestamp: { $gte: start, $lte: end } })
        .sort({ timestamp: -1 })
        .lean(),
      DollarSnapshot
        .findOne({ timestamp: { $gte: start, $lte: end } })
        .sort({ timestamp: -1 })
        .lean(),
    ]);

    // Take the latest snapshot per ticker (array is already sorted desc)
    const result: Record<string, number | null> = {};
    for (const ticker of tickers) {
      const snap = priceSnapshots.find(s => s.symbol === ticker);
      result[ticker] = snap ? snap.price : null;
    }

    result['oficial']         = dollarSnapshot?.oficial         ?? null;
    result['blue']            = dollarSnapshot?.blue            ?? null;
    result['bolsa']           = dollarSnapshot?.bolsa           ?? null;
    result['contadoconliqui'] = dollarSnapshot?.contadoconliqui ?? null;

    return result;
  }
}
```

**Step 2: Verify TypeScript compiles**

```bash
npm run build
```
Expected: no errors.

**Step 3: Commit**

```bash
git add src/services/snapshotService.ts
git commit -m "feat: add SnapshotService with save and query methods"
```

---

### Task 4: Add `manySave` handler and route

**Files:**
- Modify: `src/controllers/tickerController.ts`
- Modify: `src/routes/tickerRoutes.ts`

**Step 1: Add `SnapshotService` import and instance to controller**

In `src/controllers/tickerController.ts`, add the import at the top:

```typescript
import { SnapshotService } from "../services/snapshotService";
```

Add the instance variable inside the class (after existing ones):

```typescript
private snapshotService: SnapshotService;
```

Add initialization in `constructor()`:

```typescript
this.snapshotService = new SnapshotService();
```

**Step 2: Add `manySave` handler**

Add after `getManyCsv`, before `addTicker`:

```typescript
/**
 * GET /manysave - Igual que /many pero guarda snapshots en MongoDB
 */
manySave = async (req: Request, res: Response): Promise<void> => {
  try {
    const tickers = await this.tickerService.getAllTickers();
    const [prices, dolares] = await Promise.all([
      this.ravaScrapper.getMany(tickers),
      this.dolarAPI.getDolares(['oficial', 'blue', 'bolsa', 'contadoconliqui']),
    ]);
    await this.snapshotService.saveSnapshots(tickers, prices, dolares);
    res.status(200).json({ ...prices, ...dolares });
  } catch (error) {
    console.error('Error en manySave:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
```

**Step 3: Register route in `src/routes/tickerRoutes.ts`**

Add after the existing `/manycsv` route:

```typescript
// GET /manysave - Obtiene todos los tickers con precios y guarda snapshots
router.get("/manysave", tickerController.manySave);
```

**Step 4: Verify TypeScript compiles and test manually**

```bash
npm run build
npm run dev
# In another terminal:
curl http://localhost:3000/manysave
```
Expected: same JSON response as `/many`. Check MongoDB — should have one new `DollarSnapshot` and N new `PriceSnapshot` documents.

**Step 5: Commit**

```bash
git add src/controllers/tickerController.ts src/routes/tickerRoutes.ts
git commit -m "feat: add GET /manysave endpoint"
```

---

### Task 5: Add `manyHistory` handler and route

**Files:**
- Modify: `src/controllers/tickerController.ts`
- Modify: `src/routes/tickerRoutes.ts`

**Step 1: Add `manyHistory` handler to controller**

Add after `manySave`:

```typescript
/**
 * GET /manyhistory/:date - Retorna datos históricos para una fecha (YYYY-MM-DD)
 */
manyHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({
        error: 'Formato de fecha inválido',
        message: 'Usar formato YYYY-MM-DD, ej: 2026-03-15',
      });
      return;
    }

    const tickers = await this.tickerService.getAllTickers();
    const result = await this.snapshotService.getSnapshotsForDate(date, tickers);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error en manyHistory:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
```

**Step 2: Register route in `src/routes/tickerRoutes.ts`**

Add after `/manysave`:

```typescript
// GET /manyhistory/:date - Retorna datos históricos para una fecha YYYY-MM-DD
router.get("/manyhistory/:date", tickerController.manyHistory);
```

**Step 3: Verify TypeScript compiles and test manually**

```bash
npm run build
npm run dev
# First call /manysave to generate data, then:
curl http://localhost:3000/manyhistory/2026-03-15
```
Expected: same shape as `/many` with actual values for today. Test a date with no data:
```bash
curl http://localhost:3000/manyhistory/2020-01-01
```
Expected: all values `null`.

Test invalid date format:
```bash
curl http://localhost:3000/manyhistory/15-03-2026
```
Expected: `400` with validation message.

**Step 4: Commit**

```bash
git add src/controllers/tickerController.ts src/routes/tickerRoutes.ts
git commit -m "feat: add GET /manyhistory/:date endpoint"
```

---

### Task 6: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

Add the two new endpoints to the Endpoints section:

```markdown
- `GET /manysave` — Same as `/many` + persists `PriceSnapshot` (one per ticker) and one `DollarSnapshot` to MongoDB
- `GET /manyhistory/:date` — Same format as `/many` for a given `YYYY-MM-DD` date (UTC). Returns `null` for tickers/rates with no data on that date.
```

Add a note about the new models:

```markdown
## Snapshot persistence

`PriceSnapshot` `{ symbol, price, priceMep, source, timestamp }` — index on `(symbol, timestamp desc)`
`DollarSnapshot` `{ oficial, blue, bolsa, contadoconliqui, timestamp }` — index on `timestamp desc`
`priceMep = price / bolsa` computed at save time. Dates in `/manyhistory` are treated as UTC days.
```

**Commit:**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with snapshot endpoints and models"
```
