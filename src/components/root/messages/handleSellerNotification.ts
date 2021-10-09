import { LogService } from '@infralabs/infra-logger';
import { errors } from 'ihub-framework-ts';

import { Seller } from '../../../common/interfaces/seller';
import { ConfigMapper } from '../../configs/mappers/configMapper';
import { ConfigService } from '../../configs/services/configService';

const { NotFoundError } = errors;

export default class HandleSellerNotification {
    constructor() {}

    async execute(payload: Seller, done: Function): Promise<void> {
        const logger = new LogService();
        try {
            logger.startAt();
            logger.add('handleSellerNotification.message', `Seller ${payload.code} was received in the integration queue`);
            const configService = new ConfigService();
            const storeConfig = await configService.findStoreConfigById(payload.storeId);
            if (!storeConfig) {
                throw new NotFoundError(`Unable to merge seller configuration because the configuration of store (storeId: ${payload.storeId}) was not found.`);
            }
            const config = ConfigMapper.mapSellerToConfig(payload, storeConfig.storeCode);
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

