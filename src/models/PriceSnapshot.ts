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
