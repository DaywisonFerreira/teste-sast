import { RequestPrivate, Response, Next, helpers } from "ihub-framework-ts";
import { ConfigService } from "../../components/configs/services/configService";

// Helpers
const { StoreHelper, HttpHelper } = helpers;

export default async (req: RequestPrivate, res: Response, next: Next) => {
  try {
      console.log("KKKKKK")
    // const storeId = StoreHelper.getStoreId(req);
    // const configService = new ConfigService();
    // const config = await configService.findStoreConfigById(storeId);
    // const token = req.headers.authorization;

    // if (!config) {
    //   HttpHelper.unauthorized(
    //     res,
    //     `The configuration wasn't found for this store`
    //   );
    //   return;
    // }

    // req["storeId"] = storeId;
    // req["config"] = config;
    // req["token"] = token;

    next();
  } catch (error) {
    HttpHelper.fail(res, error);
  }
};
