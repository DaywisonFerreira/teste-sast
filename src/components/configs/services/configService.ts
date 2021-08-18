import { logger } from 'ihub-framework-ts';

// Interfaces
import { Config } from '../../../common/interfaces/config';

// Repositories
import { ConfigRepository } from '../repositories/configRepository';

// Services
import { BaseService } from '../../../common/services/baseService';

export class ConfigService extends BaseService<Config, ConfigRepository> {

  constructor() {
    super(new ConfigRepository());
  }

  async findStoreConfigById(storeId: string): Promise<Config> {
    return await this.repository.findOne({ storeId, sellerId: null }, {}, { lean: true });
  }

  async findStoreConfigByCode(storeCode: string): Promise<Config> {
    return await this.repository.findOne({ storeCode, sellerId: null }, {}, { lean: true });
  }

  async findSellerConfigById(storeId: string, sellerId: string): Promise<Config> {
    return await this.repository.findOne({ storeId, sellerId }, {}, { lean: true });
  }

  async findSellerConfigByCode(storeId: string, sellerCode: string): Promise<Config> {
    return await this.repository.findOne({ storeId, sellerCode }, {}, { lean: true });
  }

  async merge(config: Config) {
    const LOG_ID = 'ifc.inventory.api.reservation.services.configService.merge';

    const configPK: any = { storeId: config.storeId, sellerId: config.sellerId };
    const configDoc = await this.repository.findOne(configPK);
    if (!configDoc) {
      await this.repository.save(config as Config);
    } else {
      const update = { $set: { active: config.active } };
      await this.repository.findOneAndUpdate(configPK, update, { runValidators: true, useFindAndModify: false });
    }

    logger.debug(`Config identified by store code: ${config.storeCode} and seller code: ${config.sellerCode} was merged with success.`, LOG_ID);

    // const storeConfigPK: any = { storeId: config.storeId, sellerId: null };
    // const configDoc = await this.findOne(storeConfigPK);
    // if (!configDoc) {
    //     await this.save(config);
    // } else {
    //     await this.findOneAndUpdate(storeConfigPK, { $set: { active: config.active, millennium: config.millennium } }, { runValidators: true, useFindAndModify: false });
    // }
  }
}
