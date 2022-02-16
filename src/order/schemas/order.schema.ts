import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export const PublicFieldsOrder = {
  orderId: 1,
  orderCreatedAt: 1,
  receiverName: 1,
  orderUpdatedAt: 1,
  orderSale: 1,
  order: 1,
  partnerOrder: 1,
  status: 1,
  partnerStatus: 1,
  history: 1,
  'billingData.invoiceValue': 1,
  'billingData.customerDocument': 1,
  'billingData.trackingUrl': 1,
  'logisticInfo.deliveryCompany': 1,
  'logisticInfo.shippingEstimateDate': 1,
};

@Schema({ collection: 'orders', timestamps: true })
export class OrderEntity extends Document {
  @Prop({ type: Types.ObjectId, required: false })
  orderId: Types.ObjectId;

  @Prop({ type: String, required: false })
  storeCode: string;

  @Prop({ type: Types.ObjectId, required: false })
  storeId: Types.ObjectId;

  @Prop({ type: String, required: false })
  sellerCode: string;

  @Prop({ type: Types.ObjectId, required: false })
  sellerId: Types.ObjectId;

  @Prop({ type: String, required: false })
  internalOrderId: string;

  @Prop({ type: String, required: false })
  receiverName: string;

  @Prop({ type: String, required: false })
  receiverEmail: string;

  @Prop({ type: Array, required: false })
  receiverPhones: Array<any>;

  @Prop({ type: String, required: false })
  salesChannel: string;

  @Prop({ type: String, required: false })
  deliveryCity: string;

  @Prop({ type: String, required: false })
  deliveryState: string;

  @Prop({ type: String, required: false })
  deliveryZipCode: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  orderSale: string;

  @Prop({ type: String, required: false, index: true })
  order: string;

  @Prop({ type: String, required: false, index: true })
  partnerOrder: string;

  @Prop({ type: Array, required: false })
  billingData: Array<any>;

  @Prop({ type: Array, required: false })
  logisticInfo: Array<any>;

  @Prop({ type: String, required: false })
  status: string;

  @Prop({ type: Number, required: false })
  totalShippingPrice: number;

  @Prop({ type: Date, required: false })
  orderUpdatedAt: Date;

  @Prop({ type: Date, required: false })
  deliveryDate: Date;

  @Prop({ type: Date, required: false })
  orderCreatedAt: Date;

  @Prop({ type: Date, required: false })
  paymentDate: Date;

  @Prop({ type: Date, required: false })
  dispatchDate: Date;

  @Prop({ type: Date, required: false })
  estimateDeliveryDateDeliveryCompany: Date;

  @Prop({ type: String, required: false })
  partnerMessage: string;

  @Prop({ type: Number, required: false })
  numberVolumes: number;

  @Prop({ type: String, required: false })
  partnerStatus: string;

  @Prop({ type: String, required: false })
  originZipCode: string;

  @Prop({ type: String, required: false })
  square: string;

  @Prop({ type: Number, required: false })
  physicalWeight: number;

  @Prop({ type: String, required: false })
  lastOccurrenceMacro: string;

  @Prop({ type: String, required: false })
  lastOccurrenceMicro: string;

  @Prop({ type: String, required: false })
  lastOccurrenceMessage: string;

  @Prop({ type: Number, required: false })
  quantityOccurrences: number;

  @Prop({ type: String, required: false })
  i18n: string;

  @Prop({ type: Array, default: [], required: false })
  history: Array<any>;
}

export type OrderDocument = OrderEntity & Document;
export const OrderSchema = SchemaFactory.createForClass(OrderEntity);

OrderSchema.index({ _id: 1 }, { unique: true })
  .index(
    { storeId: 1, order: 1, orderSale: 1, partnerOrder: 1 },
    { unique: true },
  )
  .index(
    {
      storeId: 1,
      status: 1,
      order: 1,
      orderSale: 1,
      partnerOrder: 1,
      receiverName: 1,
    },
    { unique: false },
  )
  .index(
    {
      storeId: 1,
      status: 1,
      order: 1,
      orderSale: 1,
      partnerOrder: 1,
      orderUpdatedAt: 1,
    },
    { unique: false },
  )
  .index(
    {
      storeId: 1,
      status: 1,
      order: 1,
      orderSale: 1,
      partnerOrder: 1,
      orderCreatedAt: 1,
    },
    { unique: false },
  )
  .index(
    {
      storeId: 1,
      status: 1,
      order: 1,
      orderSale: 1,
      partnerOrder: 1,
      'logisticInfo.deliveryCompany': 1,
    },
    { unique: false },
  )
  .index(
    {
      storeId: 1,
      status: 1,
      order: 1,
      orderSale: 1,
      partnerOrder: 1,
      receiverName: 1,
      orderUpdatedAt: 1,
    },
    { unique: false },
  )
  .index(
    {
      storeId: 1,
      status: 1,
      order: 1,
      orderSale: 1,
      partnerOrder: 1,
      receiverName: 1,
      orderUpdatedAt: 1,
      orderCreatedAt: 1,
    },
    { unique: false },
  )
  .index(
    {
      storeId: 1,
      status: 1,
      order: 1,
      orderSale: 1,
      partnerOrder: 1,
      receiverName: 1,
      orderUpdatedAt: 1,
      orderCreatedAt: 1,
      'logisticInfo.deliveryCompany': 1,
    },
    { unique: false },
  )
  .index({ storeId: 1, status: 1, receiverName: 1 }, { unique: false })
  .index(
    { storeId: 1, status: 1, receiverName: 1, orderUpdatedAt: 1 },
    { unique: false },
  )
  .index(
    { storeId: 1, status: 1, receiverName: 1, orderCreatedAt: 1 },
    { unique: false },
  )
  .index(
    {
      storeId: 1,
      status: 1,
      receiverName: 1,
      'logisticInfo.deliveryCompany': 1,
    },
    { unique: false },
  )
  .index(
    {
      storeId: 1,
      status: 1,
      receiverName: 1,
      orderUpdatedAt: 1,
      orderCreatedAt: 1,
    },
    { unique: false },
  )
  .index(
    {
      storeId: 1,
      status: 1,
      receiverName: 1,
      orderUpdatedAt: 1,
      orderCreatedAt: 1,
      'logisticInfo.deliveryCompany': 1,
    },
    { unique: false },
  )
  .index({ storeId: 1, status: 1, orderUpdatedAt: 1 }, { unique: false })
  .index(
    { storeId: 1, status: 1, orderUpdatedAt: 1, orderCreatedAt: 1 },
    { unique: false },
  )
  .index(
    {
      storeId: 1,
      status: 1,
      orderUpdatedAt: 1,
      'logisticInfo.deliveryCompany': 1,
    },
    { unique: false },
  )
  .index(
    {
      storeId: 1,
      status: 1,
      orderUpdatedAt: 1,
      orderCreatedAt: 1,
      'logisticInfo.deliveryCompany': 1,
    },
    { unique: false },
  )
  .index({ storeId: 1, status: 1, orderCreatedAt: 1 }, { unique: false })
  .index(
    {
      storeId: 1,
      status: 1,
      orderCreatedAt: 1,
      'logisticInfo.deliveryCompany': 1,
    },
    { unique: false },
  )
  .index(
    { storeId: 1, status: 1, 'logisticInfo.deliveryCompany': 1 },
    { unique: false },
  )
  .index({ storeId: 1, status: 1 }, { unique: false });
