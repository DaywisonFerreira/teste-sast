import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidV4 } from 'uuid';

@Schema({ collection: 'statusCodes', timestamps: true })
export class StatusCodeEntity extends Document {
  @Prop({ type: String, required: true, default: uuidV4() })
  id: string;

  @Prop({ type: String, required: false, default: null })
  parentId: string;

  @Prop({ type: String, required: true, unique: true })
  name: string;
}

export type StatusCodeDocument = StatusCodeEntity & Document;

export const StatusCodeSchema = SchemaFactory.createForClass(StatusCodeEntity);
