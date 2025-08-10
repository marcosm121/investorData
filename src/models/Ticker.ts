import mongoose, { Document, Schema } from 'mongoose';

export interface ITicker extends Document {
  symbol: string;
  createdAt: Date;
  updatedAt: Date;
}

const TickerSchema: Schema = new Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  }
}, {
  timestamps: true
});

// Índice para búsquedas más rápidas
TickerSchema.index({ symbol: 1 });

export const Ticker = mongoose.model<ITicker>('Ticker', TickerSchema);
