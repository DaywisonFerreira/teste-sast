// import { LogService } from '@infralabs/infra-logger';

import { Store } from '../../../common/interfaces/store';

import { ConfigMapper } from '../../configs/mappers/configMapper';

import { ConfigService } from '../../configs/services/configService';

export default class HandleStoreNotification {
    constructor() {}

    async execute(payload: Store, done: Function): Promise<void>{
        const LOG_ID = 'ifc.freight.api.orders.HandleStoreNotification';
        // const logger = new LogService();
        // logger.startAt();
        // logger.add(`Store ${payload.code} was received in the integration queue`, LOG_ID);
        console.log(`Store ${payload.code} was received in the integration queue`, LOG_ID);

        try {
            const configService = new ConfigService();
            const config = ConfigMapper.mapStoreToConfig(payload);
            await configService.merge(config);
            // logger.endAt();
            // await logger.sendLog();
        } catch (error) {
            console.log(error);
            // logger.error(error);
            // logger.endAt();
            // await logger.sendLog();
        } finally {
            done();
        }
    }
}
