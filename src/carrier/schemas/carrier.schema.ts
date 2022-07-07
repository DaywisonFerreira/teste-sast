import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

class Attributes {
  key: string;

  value: string | number | boolean;
}

class Integration {
  type: string;

  endpoint: string;

  attributes: Attributes[];
}

export class DeliveryMethods {
  deliveryModeName: string;

  externalDeliveryMethodId: string;
}

export class Account {
  id: string;

  externalDeliveryMethods: DeliveryMethods[];
}

export class Intelipost {
  accounts: Account[];
}

export class Partners {
  intelipost: Intelipost;
}

@Schema({ collection: 'carriers', timestamps: true })
export class CarrierEntity extends Document {
  @Prop({ unique: true, type: String })
  id: string;

  @Prop({ type: String, required: true })
  carrier: string;

  @Prop({ type: String, required: false })
  email: string;

  @Prop({ type: String, required: true })
  document: string;

  @Prop({ type: String, required: false })
  phone: string;

  @Prop({ type: String, required: false, default: '' })
  logo: string;

  @Prop({ type: Partners, required: false })
  partners: Partners;

  // TODO: deprecated
  @Prop({ type: String, required: false, default: '' })
  externalDeliveryMethodId: string;

  @Prop({ type: Boolean, default: true })
  active: boolean;

  @Prop({ type: String, required: false })
  observation: string;

  @Prop({ type: Boolean, required: false })
  generateNotfisFile: boolean;

  @Prop({ type: Integration, required: false })
  integration: Integration;
}

export type CarrierDocument = CarrierEntity & Document;

export const CarrierSchema = SchemaFactory.createForClass(CarrierEntity);

CarrierSchema.index({ carrier: 1, document: 1 }, { unique: true })
  .index({ carrier: 1 }, { unique: true })
  .index({ document: 1 }, { unique: true })
  .index({ id: 1 }, { unique: true });
