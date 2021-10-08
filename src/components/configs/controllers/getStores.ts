import { Response, helpers } from 'ihub-framework-ts';
// import { LogService } from '@infralabs/infra-logger';
import { IRequest } from '../../../common/interfaces/request';

import { ConfigService } from '../services/configService';

const { HttpHelper } = helpers;

export default async (req: IRequest, res: Response): Promise<void> => {
    // const logger = new LogService();
    try {
        // logger.startAt();
        const { stores } = req

        const configService = new ConfigService()

        const response = await configService.findStoresOfUser(stores)

        // logger.add('ifc.freight.api.orders.getStores', `Request received from ${req.email}, Payload: ${JSON.stringify(response)}`);
        console.log('ifc.freight.api.orders.getStores', `Request received from ${req.email}, Payload: ${JSON.stringify(response)}`);
        // logger.endAt();
        // await logger.sendLog();

        HttpHelper.ok(
            res,
            response
        );
    } catch (error) {
        console.log('ifc.freight.api.orders.getStores.error', error);
        // logger.error(error);
        // logger.endAt();
        // await logger.sendLog();
        HttpHelper.fail(res, error);
    }
};
