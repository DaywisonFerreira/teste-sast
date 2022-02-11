import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'stores', timestamps: true })
export class StoreEntity extends Document {
  @Prop({ type: String, required: true })
  code: string;

  @Prop({ type: Boolean, required: true })
  active: boolean;

  @Prop({ type: String, required: true })
  icon: string;

  @Prop({ type: String, required: true })
  name: string;
}

export type StoreDocument = StoreEntity & Document;
export const StoreSchema = SchemaFactory.createForClass(StoreEntity);

StoreSchema.index({ id: 1 }, { unique: true });
