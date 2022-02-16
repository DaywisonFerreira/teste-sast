import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { INotifiedUsers } from '../interfaces/notified-users.interface';

@Schema({ collection: 'notifications', timestamps: true })
export class NotificationEntity extends Document {
  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: String, required: true })
  origin: string;

  @Prop({ type: Array, required: true })
  notifiedUsers: Array<INotifiedUsers>;

  @Prop({ type: String, required: false })
  payload: string;

  @Prop({ type: Date, required: false })
  createdAt: Date;
}

export type NotificationDocument = NotificationEntity & Document;
export const NotificationSchema =
  SchemaFactory.createForClass(NotificationEntity);

NotificationSchema.index({ type: 1 }, { unique: false })
  .index({ origin: 1 }, { unique: false })
  .index({ type: 1, 'notifiedUsers.user': 1 }, { unique: false })
  .index({ 'notifiedUsers.user': 1 }, { unique: false })
  .index({ createdAt: 1 }, { unique: false });
