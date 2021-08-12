import { database } from 'ihub-framework-ts';

const { Schema } = database;

const OrderSchema = new Schema({
    orderId: {
        type: Schema.Types.ObjectId,
        unique: true,
        index: true,
        required: true
    },
    storeCode: {
        type: String,
        required: true
    },
    storeId: {
        type: String,
        required: true
    },
    sellerCode: {
        type: String,
        required: false
    },
    sellerId: {
        type: String,
        required: false
    },
    internalOrderId: {
        type: String,
        required: true
    },
    receiverName: {
        type: String,
        required: true
    },
    receiverEmail: {
        type: String,
        required: true
    },
    receiverPhones: {
        type: Array,
        required: true
    },
    salesChannel: {
        type: String,
        required: false
    },
    deliveryCity: {
        type: String,
        required: true
    },
    deliveryState: {
        type: String,
        required: true
    },
    deliveryZipCode: {
        type: String,
        required: true
    },
    orderSale: {
        type: String,
        required: false
    },
    order: {
        type: String,
        required: false
    },
    billingData: {
        type: Array,
        required: true
    },
    logisticInfo: {
        type: Array,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    totalShippingPrice: {
        type: Number,
        required: false
    },
    orderUpdatedAt: {
        type: Date,
        required: true
    },
    deliveryDate: {
        type: Date,
        required: false
    },
    orderCreatedAt: {
        type: Date,
        required: true
    },
    paymentDate: {
        type: Date,
        required: false
    },
    dispatchDate: {
        type: Date,
        requuired: false
    },
    estimateDeliveryDateDeliveryCompany: {
        type: Date,
        required: false
    },
    partnerMessage: {
        type: String,
        required: false
    },
    numberVolumes: {
        type: Number,
        required: false
    },
    partnerStatus: {
        type: String,
        required: false
    },
    partnerUpdatedAt:{
        type: String,
        required: false
    },
    originZipCode: {
        type: String,
        required: false
    },
    square: {
        type: String,
        required: false
    },
    physicalWeight: {
        type: Number,
        required: false
    },
    lastOccurrenceMacro: {
        type: String,
        required: false
    },
    lastOccurrenceMicro: {
        type: String,
        required: false
    },
    lastOccurrenceMessage: {
        type: String,
        required: false
    },
    quantityOccurrences: {
        type: Number,
        required: false
    }
}, { timestamps: {}, autoIndex: false });

const schema: any = new database.Schema(OrderSchema, {
    collection: 'orders',
    timestamps: true
}).index({ orderId: 1 }, { unique: true });

export default schema;
