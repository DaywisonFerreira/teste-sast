// Interfaces
import { Config } from '../../../common/interfaces/config'
import { Seller } from '../../../common/interfaces/seller';
import { Store } from '../../../common/interfaces/store';
import { Order } from '../../orders/interfaces/Order';

export class ConfigMapper {

  static mapSellerToConfig(seller: Seller, storeCode: string): Config {
    const { _id, code, storeId, active } = seller;
    const config = {
      sellerId: _id,
      sellerCode: code,
      storeId,
      storeCode,
      active,
    } as Config;

    return config;
  }

  static mapStoreToConfig(store: Store): Config {
    const { _id, code, active } = store;
    const config = {
      storeId: _id,
      storeCode: code,
      active,
    } as Config;

    return config;
  }

  static mapOrderToConfig(order: Order, active: boolean, sellerId: string): Config {
    const { storeId, storeCode, sellerCode } = order;
    const config = {
      storeId,
      storeCode,
      sellerId,
      sellerCode,
      active,
    } as Config;

    return config;
  }
}
