import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidV4 } from 'uuid';

@Schema({ collection: 'statusCodes', timestamps: true })
export class StatusCodeEntity extends Document {
  @Prop({ type: String, required: true, default: uuidV4() })
  id: string;

  @Prop({ type: String, required: true })
  macro: string;

  @Prop({ type: String, required: true })
  micro: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;
}

export type StatusCodeDocument = StatusCodeEntity & Document;

export const StatusCodeSchema = SchemaFactory.createForClass(StatusCodeEntity);
StatusCodeSchema.index({ macro: 1, micro: 1 }, { unique: true });
