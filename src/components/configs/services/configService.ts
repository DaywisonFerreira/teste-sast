import { LogService } from '@infralabs/infra-logger';
import { Config } from '../../../common/interfaces/config';
import { ConfigRepository } from '../repositories/configRepository';
import { BaseService } from '../../../common/services/baseService';

export class ConfigService extends BaseService<Config, ConfigRepository> {

  constructor() {
    super(new ConfigRepository());
  }

  async findStoresOfUser(stores: string[]): Promise<Partial<Config[]>> {
    return await this.repository.find({ storeId: { $in: stores }, $and: [{ active: true, sellerId: null }]}, { name: 1, icon: 1, storeCode: 1, storeId: 1 })
  }

  async findStoreConfigById(storeId: string): Promise<Config> {
    return await this.repository.findOne({ storeId, sellerId: null }, {}, { lean: true });
  }

  async merge(config: Config): Promise<void> {
    const logger = new LogService();
    logger.startAt();

    const LOG_ID = 'ifc.freight.api.orders.services.configService.merge';

    const configPK: any = { storeId: config.storeId, sellerId: config.sellerId };
    const configDoc = await this.repository.findOne(configPK);
    if (!configDoc) {
      await this.repository.save(config as Config);
    } else {
      const update = { $set: { active: config.active } };
      await this.repository.findOneAndUpdate(configPK, update, { runValidators: true, useFindAndModify: false });
    }
    logger.add(LOG_ID, `Config identified by store code: ${config.storeCode} and seller code: ${config.sellerCode} was merged with success.`);
    logger.endAt();
    await logger.sendLog();
  }
}
