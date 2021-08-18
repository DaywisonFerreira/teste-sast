import { database } from 'ihub-framework-ts';

const { Schema } = database;
const { ObjectId } = Schema.Types;

const schemaInstance = new Schema({
    storeId: {
        type: ObjectId,
        required: true,
    },
    storeCode: {
        type: String,
        required: true,
    },
    sellerId: {
        type: ObjectId,
        required: false,
    },
    sellerCode: {
        type: String,
        required: false,
    },
    active: {
        type: Boolean,
        required: true,
        default: false,
    },
}, { collection: 'configs', timestamps: true });

schemaInstance
    .index({ storeCode: 1, sellerCode: 1 }, { unique: true })
    .index({ storeId: 1, sellerId: 1 }, { unique: true })
    .index({ storeId: 1, createdAt: 1 }, { unique: false })
    .index({ storeId: 1, updatedAt: 1 }, { unique: false });

export default schemaInstance;
