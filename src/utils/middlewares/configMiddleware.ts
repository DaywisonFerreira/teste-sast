import { Response, Next, helpers } from "ihub-framework-ts";
import { IRequest } from '../../common/interfaces/request';
import { ConfigService } from "../../components/configs/services/configService";

const { HttpHelper } = helpers;

export default async (req: IRequest, res: Response, next: Next) => {
    try {
        const { storeId } = req

        if(!storeId){
            return HttpHelper.notFound(res, "Missing property \"storeId\"");
        }

        const configService = new ConfigService();
        const config = await configService.findStoreConfigById(String(storeId));

        if (!config || !config.active){
            return HttpHelper.notFound(
                res,
                "The configuration wasn't found for this store"
            );
        }

        req['config'] = config
        console.log('configMiddleware', JSON.stringify(config))

        next();
    } catch (error) {
        HttpHelper.fail(res, error);
    }
};
