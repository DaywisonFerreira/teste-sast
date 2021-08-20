import { Response, Next, helpers } from "ihub-framework-ts";
import { IRequest } from '../../common/interfaces/request';
import { ConfigService } from "../../components/configs/services/configService";

import JWT from '../JwtUtils';

const { HttpHelper } = helpers;

export default async (req: IRequest, res: Response, next: Next) => {
    try {
        const storeId = req.headers["x-cxaas-accountid"];
        const token = req.headers["authorization"];

        const { stores, email } = JWT.decode(token)

        if(!stores.includes(storeId)){
            return HttpHelper.unauthorized(res)
        }

        const configService = new ConfigService();
        const config = await configService.findStoreConfigById(String(storeId));

        if (!config || !config.active){
            return HttpHelper.unauthorized(
                res,
                "The configuration wasn't found for this store"
            );
        }

        req['storeId'] = storeId
        req['config'] = config
        req['email'] = email

        next();
    } catch (error) {
        HttpHelper.fail(res, error);
    }
};
