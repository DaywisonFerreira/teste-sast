import HandleOrderNotification from './handleOrderNotification';

export default class HandleImportOrder {
    constructor() {}

    async execute(payload: any, done: Function): Promise<void> {
        await new HandleOrderNotification().execute(payload, done)
    }
}
