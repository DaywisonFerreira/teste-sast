/* eslint-disable max-classes-per-file */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export const PublicFieldsInvoice = {
  _id: 0,
  number: 1,
  serie: 1,
  key: 1,
  protocol: 1,
  emissionDate: 1,
  operationType: 1,
  isOut: 1,
  estimatedDeliveryDate: 1,
  'order.internalOrderId': 1,
  'order.externalOrderId': 1,
  packages: 1,
  'total.freightValue': 1,
  'total.value': 1,
  carrier: 1,
  emitter: 1,
  'receiver.address.zipCode': 1,
  notfisFile: 1,
  notfisFileName: 1,
  createdAt: 1,
  updatedAt: 1,
};

class Order {
  internalOrderId: string;

  externalOrderId: string;
}

class CarrierData {
  name?: string;

  email?: string;

  document: string;

  documentType: string;

  stateInscription?: string;

  phone?: string;
}

@Schema({ collection: 'invoices', timestamps: true })
export class InvoiceEntity extends Document {
  @Prop({ type: String, required: true })
  id: string;

  @Prop({ type: Number, required: false })
  number: number;

  @Prop({ type: String, required: true })
  accountId: string;

  @Prop({ type: String, required: true })
  key: string;

  @Prop({ type: Order, required: true })
  order: Order;

  @Prop({ type: String, required: false })
  status: string;

  @Prop({ type: String, required: false })
  errorLog: string;

  @Prop({ type: CarrierData, required: true })
  carrier: CarrierData;
}

export type InvoiceDocument = InvoiceEntity & Document;
export const InvoiceSchema = SchemaFactory.createForClass(InvoiceEntity);

InvoiceSchema.index({ status: 1, key: 1, 'order.externalOrderId': 1 });
