/* eslint-disable max-classes-per-file */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export const PublicFieldsOrder = {
  orderId: 1,
  orderCreatedAt: 1,
  'customer.fullName': 1,
  'customer.firstName': 1,
  'customer.lastName': 1,
  orderUpdatedAt: 1,
  estimateDeliveryDateDeliveryCompany: 1,
  orderSale: 1,
  order: 1,
  status: 1,
  partnerStatus: 1,
  statusCode: 1,
  history: 1,
  'invoice.number': 1,
  'invoice.trackingUrl': 1,
  'invoice.customerDocument': 1,
  'billingData.invoiceValue': 1,
  'billingData.customerDocument': 1,
  'billingData.trackingUrl': 1,
  'logisticInfo.deliveryCompany': 1,
  'logisticInfo.shippingEstimateDate': 1,
  integrations: 1,
  invoiceKeys: 1,
};

export class Total {
  id: string;

  name: string;

  value: number;
}

export class Item {
  sku: string;

  quantity: number;

  price: number;

  isSubsidized: boolean;
}
export class Invoice {
  @Prop({ type: String, required: false })
  serie?: string;

  @Prop({ type: Number, required: false })
  value?: number;

  @Prop({ type: String, required: false })
  number?: string;

  @Prop({ type: String, required: true })
  key: string;

  @Prop({ type: Date, required: false })
  issuanceDate?: Date;

  @Prop({ type: String, required: false })
  carrierName?: string;

  @Prop({ type: String, required: false })
  carrierDocument?: string;

  @Prop({ type: String, required: false })
  trackingNumber?: string;

  @Prop({ type: String, required: false })
  trackingUrl?: string;

  @Prop({ type: Array, required: false })
  items?: Array<Item>;

  @Prop({ type: String, required: false })
  customerDocument?: string;

  @Prop({ type: String, required: false })
  deliveryMethod?: string;
}

export class Delivery {
  receiverName: string;

  city: string;

  state: string;

  zipCode: string;

  country: string;
}

export class Phone {
  phone: string;

  type: string;
}

export class Customer {
  phones: Array<Phone>;

  email: string;

  isCorporate: boolean;

  firstName: string;

  lastName: string;

  document: string;

  documentType: string;

  corporateName: string;

  fullName: string;
}

export class StatusCode {
  micro: string;

  macro: string;
}

export class additionalInfo {
  key1: string;

  key2: string;
}
export class Attachments {
  fileName: string;

  mimeType: string;

  type: string;

  additionalInfo: additionalInfo;

  url: string;

  originalUrl: string;

  createdAt: string;
}

class Integrations {
  name: string;

  status: string;

  errorMessage: string;

  createdAt: Date;
}

export class PickupStoreInfo {
  additionalInfo: string;

  dockId: string;

  friendlyName: string;

  isPickupStore: boolean;
}

export class LogisticInfo {
  pickupStoreInfo: PickupStoreInfo;

  shipsTo: Array<any>;

  _id: string;

  itemIndex: number;

  logisticContract: string;

  lockTTL: string;

  price: number;

  listPrice: number;

  sellingPrice: number;

  deliveryWindow: string;

  deliveryCompany: string;

  shippingEstimate: string;

  shippingEstimateDate: Date;

  deliveryChannel: string;

  deliveryIds: {
    _id: string;
    courierId: string;
    courierName: string;
    dockId: string;
    quantity: number;
    warehouseId: string;
  }[];
}

export class History {
  volumeNumber: number;

  dispatchDate?: Date;

  estimateDeliveryDateDeliveryCompany: Date;

  partnerMessage: string;

  microStatus: string;

  lastOccurrenceMacro: string;

  lastOccurrenceMicro: string;

  lastOccurrenceMessage: string;

  partnerStatusId: string;

  partnerStatus: string;

  orderUpdatedAt: Date;

  i18n: string;

  statusCode: StatusCode;
}

export class BillingData {
  pickupInfo: {
    isReady: boolean;
  };

  _id: string;

  invoiceSerialNumber: string;

  invoiceValue: number;

  invoiceNumber: string;

  invoiceKey: string;

  issuanceDate: Date;

  carrierName: string;

  trackingNumber: string;

  trackingUrl: string;

  customerDocument: string;

  items: Array<Item>;

  events: any[];
}

@Schema({ collection: 'orders', timestamps: true })
export class OrderEntity extends Document {
  @Prop({ type: Types.ObjectId, required: false })
  orderId?: Types.ObjectId | string;

  @Prop({ type: String, required: false })
  storeCode?: string;

  @Prop({ type: Types.ObjectId, required: false })
  storeId?: Types.ObjectId | string;

  @Prop({ type: String, required: false })
  sellerCode?: string;

  @Prop({ type: Types.ObjectId, required: false })
  sellerId?: Types.ObjectId | string;

  @Prop({ type: String, required: false })
  internalOrderId?: string;

  // @deprecated
  @Prop({ type: String, required: false })
  receiverName?: string;

  // @deprecated
  @Prop({ type: String, required: false })
  receiverEmail?: string;

  // @deprecated
  @Prop({ type: Array, required: false })
  receiverPhones?: Array<Phone>;

  @Prop({ type: String, required: false })
  salesChannel?: string;

  // @deprecated
  @Prop({ type: String, required: false })
  deliveryCity?: string;

  // @deprecated
  @Prop({ type: String, required: false })
  deliveryState?: string;

  // @deprecated
  @Prop({ type: String, required: false })
  deliveryZipCode?: string;

  @Prop({ type: String, required: false })
  orderSale?: string;

  @Prop({ type: String, required: false })
  order?: string;

  @Prop({ type: String, required: false })
  partnerOrder?: string;

  @Prop({ type: Array, required: false })
  billingData?: Array<BillingData>;

  @Prop({ type: Array, required: false })
  logisticInfo?: Array<LogisticInfo>;

  @Prop({ type: String, required: false })
  status?: string;

  @Prop({ type: Number, required: false })
  totalShippingPrice?: number;

  @Prop({ type: Date, required: false })
  orderUpdatedAt?: Date;

  @Prop({ type: Date, required: false })
  deliveryDate?: Date;

  @Prop({ type: Date, required: false })
  orderCreatedAt?: Date;

  @Prop({ type: Date, required: false })
  paymentDate?: Date;

  @Prop({ type: Array, required: false })
  invoiceKeys?: Array<string>;

  @Prop({ type: Array, required: false })
  totals?: Array<Total>;

  @Prop({ type: Number, required: false })
  value?: number;

  @Prop({ type: Invoice, required: true })
  invoice: Invoice;

  @Prop({ type: Object, required: false })
  delivery?: Delivery;

  @Prop({ type: Object, required: false })
  customer?: Customer;

  @Prop({ type: Date, required: false })
  dispatchDate?: Date;

  @Prop({ type: Date, required: false })
  estimateDeliveryDateDeliveryCompany?: Date;

  @Prop({ type: String, required: false })
  partnerMessage?: string;

  @Prop({ type: String, required: false })
  partnerStatusId?: string;

  @Prop({ type: String, required: false })
  partnerMacroStatusId?: string;

  // @deprecated
  @Prop({ type: Number, required: false })
  numberVolumes?: number;

  @Prop({ type: Number, required: false })
  volumeNumber?: number;

  @Prop({ type: String, required: false })
  microStatus?: string;

  @Prop({ type: String, required: false })
  lastOccurrenceMacro?: string;

  @Prop({ type: String, required: false })
  lastOccurrenceMicro?: string;

  @Prop({ type: String, required: false })
  lastOccurrenceMessage?: string;

  @Prop({ type: String, required: false })
  partnerStatus?: string;

  @Prop({ type: Object, required: false })
  statusCode?: StatusCode;

  @Prop({ type: String, required: false })
  i18n?: string;

  @Prop({ type: Array, required: false })
  history?: Array<History>;

  @Prop({ type: Array, required: false })
  attachments?: Array<Attachments>;

  @Prop({ type: String, required: false })
  originZipCode?: string; // campo só usado no relatorio

  @Prop({ type: String, required: false })
  square?: string; // campo só usado no relatorio

  @Prop({ type: Number, required: false })
  physicalWeight?: number; // campo só usado no relatorio

  @Prop({ type: Number, required: false })
  quantityOccurrences?: number; // campo só usado no relatorio

  @Prop({ type: Array, required: false })
  integrations?: Array<Integrations>;
}

export type OrderDocument = OrderEntity & Document;
export const OrderSchema = SchemaFactory.createForClass(OrderEntity);

OrderSchema.index({ 'invoice.key': 1 }, { unique: true })
  .index({ orderSale: 1, 'invoice.key': 1 }, { unique: false })
  .index({ orderSale: 1, invoiceKeys: 1 }, { unique: false })
  .index({ partnerOrder: 1 }, { unique: false })
  .index({ order: 1 }, { unique: false })
  .index({ orderSale: 1 }, { unique: false })
  .index({ storeCode: 1 }, { unique: false })
  .index({ 'statusCode.micro': 1 }, { unique: false })
  .index({ 'invoice.carrierDocument': 1 }, { unique: false })
  .index({ createdAt: -1 }, { unique: false })
  .index({ orderId: 1 }, { unique: false })
  .index({ storeId: 1, orderCreatedAt: 1 }, { unique: false })
  .index(
    {
      storeId: 1,
      orderCreatedAt: 1,
      estimateDeliveryDateDeliveryCompany: 1,
      'statusCode.micro': 1,
    },
    { unique: false },
  )
  .index(
    {
      storeId: 1,
      orderCreatedAt: 1,
      estimateDeliveryDateDeliveryCompany: 1,
      'statusCode.micro': 1,
      order: 1,
      orderSale: 1,
      partnerOrder: 1,
      'customer.firstName': 1,
      'customer.fullName': 1,
      'invoice.number': 1,
      'invoice.customerDocument': 1,
      'logisticInfo.deliveryCompany': 1,
    },
    { unique: false },
  );
