import { LogService } from '@infralabs/infra-logger';

export default class HandleImportOrder {
    constructor() {}

    async execute(payload: any, done: Function): Promise<void> {
        const logger = new LogService();

        try {
            logger.startAt();
            logger.add('importOrdersPayload', payload);
            logger.endAt();
            await logger.sendLog();
            console.log('importOrdersPayload', JSON.stringify(payload));
        } catch (error) {
            logger.error(error);
            logger.endAt();
            await logger.sendLog();
        } finally {
            done();
        }
    }
}
