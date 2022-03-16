import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'trackingCodes', timestamps: true })
export class TrackingCodeEntity extends Document {
  @Prop({ type: String, required: true })
  accountId: string;

  @Prop({ type: String, required: true })
  carrierId: string;

  @Prop({ type: String, required: true })
  trackingCode: string;

  @Prop({ type: Boolean, required: true })
  trackingCodeUsed: boolean;
}

export type TrackingCodeDocument = TrackingCodeEntity & Document;

export const TrackingCodeSchema =
  SchemaFactory.createForClass(TrackingCodeEntity);

TrackingCodeSchema.index(
  { accountId: 1, carrierId: 1, trackingCode: 1 },
  { unique: true },
).index({ accountId: 1, carrierId: 1, trackingCodeUsed: 1 });
