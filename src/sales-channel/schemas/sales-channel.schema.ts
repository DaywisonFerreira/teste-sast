import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'saleschannels', timestamps: true })
export class SalesChannelEntity extends Document {
  @Prop()
  id: string;

  @Prop()
  name: string;

  @Prop()
  platform: string;

  @Prop()
  type: string;
}

export type SalesChannelDocument = SalesChannelEntity & Document;

export const SalesChannelSchema =
  SchemaFactory.createForClass(SalesChannelEntity);
