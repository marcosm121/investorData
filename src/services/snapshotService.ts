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
  ): Promise<Record<string, { ars: number | null; usd: number | null } | number | null>> {
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
    const result: Record<string, { ars: number | null; usd: number | null } | number | null> = {};
    for (const ticker of tickers) {
      const snap = priceSnapshots.find(s => s.symbol === ticker);
      result[ticker] = snap ? { ars: snap.price, usd: snap.priceMep } : { ars: null, usd: null };
    }

    result['oficial']         = dollarSnapshot?.oficial         ?? null;
    result['blue']            = dollarSnapshot?.blue            ?? null;
    result['bolsa']           = dollarSnapshot?.bolsa           ?? null;
    result['contadoconliqui'] = dollarSnapshot?.contadoconliqui ?? null;

    return result;
  }
}
