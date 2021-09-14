import { database } from 'ihub-framework-ts';

const { Schema } = database;

const schemaInstance = new Schema({
    notificationType:{
        type: String,
        required: true
    },
    payload:{
        type: String,
        required: false
    },
    notifiedUsers:{
        type: Array,
        required: true
    }
}, { collection: 'notifications', timestamps: true });

schemaInstance
    .index({ notificationType: 1 }, { unique: false })
    .index({ notificationType: 1, 'notifiedUsers.user': 1 }, { unique: false })
    .index({ 'notifiedUsers.user': 1 }, { unique: false })
    .index({ createdAt: 1 }, { unique: false })

export default schemaInstance;
