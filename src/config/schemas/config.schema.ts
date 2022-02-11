import { Document, Schema as MongooseSchema } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'configs', timestamps: true })
export class Config {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  storeId: string;

  @Prop({ type: String, required: true })
  storeCode: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, default: null })
  sellerId: string;

  @Prop({ type: String, default: null })
  sellerCode: string;

  @Prop({ required: true, default: false })
  active: boolean;
}

export type ConfigDocument = Config & Document;

export const ConfigSchema = SchemaFactory.createForClass(Config);

ConfigSchema.index({ storeCode: 1, sellerCode: 1 }, { unique: true })
  .index({ storeId: 1, sellerId: 1 }, { unique: true })
  .index({ storeId: 1, createdAt: 1 }, { unique: false })
  .index({ storeId: 1, updatedAt: 1 }, { unique: false });
