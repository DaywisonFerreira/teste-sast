import { Response, Next, helpers } from "ihub-framework-ts";
import { IRequest } from '../../common/interfaces/request';
import { ConfigService } from "../../components/configs/services/configService";

import { JWTUtils } from '../JwtUtils';

const { HttpHelper } = helpers;

export default async (req: IRequest, res: Response, next: Next) => {
    try {
        const storeId = req.headers["x-cxaas-accountid"];
        const token = req.headers["authorization"];

        if(!storeId || !token){
            return HttpHelper.clientError(res, "Missing Headers X-CXAAS-AccountId / Authorization");
        }

        const jwtPayload = JWTUtils.decode(token);

        if(jwtPayload.hasError){
            return HttpHelper.unauthorized(res, jwtPayload.error)
        }

        const { stores, email } = jwtPayload.data

        if(!stores.includes(storeId)){
            return HttpHelper.forbidden(res, "This user does not have access to this Account")
        }

        const configService = new ConfigService();
        const config = await configService.findStoreConfigById(String(storeId));

        if (!config || !config.active){
            return HttpHelper.notFound(
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
