import { database } from 'ihub-framework-ts';

const { Schema } = database;

const OrderSchema = new Schema({
    orderId: {
        type: Schema.Types.ObjectId,
        unique: false,
        index: true,
        required: false
    },
    storeCode: {
        type: String,
        required: false
    },
    storeId: {
        type: Schema.Types.ObjectId,
        required: false
    },
    sellerCode: {
        type: String,
        required: false
    },
    sellerId: {
        type: Schema.Types.ObjectId,
        required: false
    },
    internalOrderId: {
        type: String,
        required: false
    },
    receiverName: {
        type: String,
        required: false
    },
    receiverEmail: {
        type: String,
        required: false
    },
    receiverPhones: {
        type: Array,
        required: false
    },
    salesChannel: {
        type: String,
        required: false
    },
    deliveryCity: {
        type: String,
        required: false
    },
    deliveryState: {
        type: String,
        required: false
    },
    deliveryZipCode: {
        type: String,
        required: false
    },
    orderSale: {
        type: String,
        unique: true,
        index: true,
        required: true
    },
    order: {
        type: String,
        index: true,
        required: true
    },
    billingData: {
        type: Array,
        required: false
    },
    logisticInfo: {
        type: Array,
        required: false
    },
    status: {
        type: String,
        required: false
    },
    totalShippingPrice: {
        type: Number,
        required: false
    },
    orderUpdatedAt: {
        type: Date,
        required: false
    },
    deliveryDate: {
        type: Date,
        required: false
    },
    orderCreatedAt: {
        type: Date,
        required: false
    },
    paymentDate: {
        type: Date,
        required: false
    },
    dispatchDate: {
        type: Date,
        required: false
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
    partnerUpdatedAt: {
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
})
    .index({ storeId: 1, order: 1, orderSale: 1, }, { unique: true })
    .index({ storeId: 1, order: 1, orderSale: 1, receiverName: 1 }, { unique: false })
    .index({ storeId: 1, order: 1, orderSale: 1, orderUpdatedAt: 1 }, { unique: false })
    .index({ storeId: 1, order: 1, orderSale: 1, orderCreatedAt: 1 }, { unique: false })
    .index({ storeId: 1, order: 1, orderSale: 1, "logisticInfo.deliveryCompany": 1 }, { unique: false })
    .index({ storeId: 1, order: 1, orderSale: 1, receiverName: 1, orderUpdatedAt: 1 }, { unique: false })
    .index({ storeId: 1, order: 1, orderSale: 1, receiverName: 1, orderUpdatedAt: 1, orderCreatedAt: 1 }, { unique: false })
    .index({ storeId: 1, order: 1, orderSale: 1, receiverName: 1, orderUpdatedAt: 1, orderCreatedAt: 1, "logisticInfo.deliveryCompany": 1 }, { unique: false })
    .index({ storeId: 1, receiverName: 1 }, { unique: false })
    .index({ storeId: 1, receiverName: 1, orderUpdatedAt: 1 }, { unique: false })
    .index({ storeId: 1, receiverName: 1, orderCreatedAt: 1 }, { unique: false })
    .index({ storeId: 1, receiverName: 1, "logisticInfo.deliveryCompany": 1 }, { unique: false })
    .index({ storeId: 1, receiverName: 1, orderUpdatedAt: 1, orderCreatedAt: 1 }, { unique: false })
    .index({ storeId: 1, receiverName: 1, orderUpdatedAt: 1, orderCreatedAt: 1, "logisticInfo.deliveryCompany": 1 }, { unique: false })
    .index({ storeId: 1, orderUpdatedAt: 1 }, { unique: false })
    .index({ storeId: 1, orderUpdatedAt: 1, orderCreatedAt: 1 }, { unique: false })
    .index({ storeId: 1, orderUpdatedAt: 1, "logisticInfo.deliveryCompany": 1 }, { unique: false })
    .index({ storeId: 1, orderUpdatedAt: 1, orderCreatedAt: 1, "logisticInfo.deliveryCompany": 1 }, { unique: false })
    .index({ storeId: 1, orderCreatedAt: 1 }, { unique: false })
    .index({ storeId: 1, orderCreatedAt: 1, "logisticInfo.deliveryCompany": 1 }, { unique: false })
    .index({ storeId: 1, "logisticInfo.deliveryCompany": 1 }, { unique: false })
    .index({ order: 'text', orderSale: 'text', receiverName: 'text' });

export default schema;
