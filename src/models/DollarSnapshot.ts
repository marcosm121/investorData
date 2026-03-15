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
