import { Response, Next, helpers } from "ihub-framework-ts";
import { IRequest } from '../../common/interfaces/request';

const { HttpHelper } = helpers;

export default async (req: IRequest, res: Response, next: Next) => {
    try {
        const storeId = req.headers["x-cxaas-accountid"];

        if(!storeId){
            return HttpHelper.clientError(res, "Missing Header X-CXAAS-AccountId");
        }

        const { stores } = req

        if(!Array.isArray(stores) || stores.length === 0 ){
            return HttpHelper.notFound(res, "Missing property \"stores\"");
        }

        if(!stores.includes(String(storeId))){
            return HttpHelper.forbidden(res, "This user does not have access to this Account")
        }

        req['storeId'] = storeId

        next();
    } catch (error) {
        HttpHelper.fail(res, error);
    }
};
