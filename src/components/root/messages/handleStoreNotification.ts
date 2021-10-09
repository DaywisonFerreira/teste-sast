import { LogService } from '@infralabs/infra-logger';

import { Store } from '../../../common/interfaces/store';
import { ConfigMapper } from '../../configs/mappers/configMapper';
import { ConfigService } from '../../configs/services/configService';

export default class HandleStoreNotification {
    constructor() {}

    async execute(payload: Store, done: Function): Promise<void> {
        const logger = new LogService();
        try {
            logger.startAt();
            logger.add('handleStoreNotification.message', `Store ${payload.code} was received in the integration queue`);
            const configService = new ConfigService();
            const config = ConfigMapper.mapStoreToConfig(payload);
            await configService.merge(config);
            logger.endAt();
            await logger.sendLog();
        } catch (error) {
            logger.error(error);
            logger.endAt();
            await logger.sendLog();
        } finally {
            done();
        }
    }
}
