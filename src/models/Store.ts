import { database } from 'ihub-framework-ts';

const { Schema } = database;

const StoreSchema = new Schema({
    active: {
        type: Boolean,
        default: true,
    },
    code: {
        type: String,
        unique: true,
        index: true,
        required: [true, 'Favor informar o Store Code da loja'],
        trim: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    siteUrl: {
        type: String,
        trim: true,
    },
    icon: {
        type: String,
        trim: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: {} });

const schema: any = new database.Schema(StoreSchema, { collection: 'stores' })

export default schema;
