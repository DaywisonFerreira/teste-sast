import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Config, ConfigDocument } from './schemas/config.schema';

@Injectable()
export class ConfigService {
  constructor(
    @InjectModel(Config.name)
    private configModel: Model<ConfigDocument>,
  ) {}

  findStoreConfigById(storeId: string) {
    return this.configModel.findOne(
      { storeId, sellerId: null },
      {},
      { lean: true },
    );
  }

  findStoreConfigByCode(storeCode: string) {
    return this.configModel.findOne(
      { storeCode, sellerId: null },
      {},
      { lean: true },
    );
  }

  findSellerConfigById(storeId: string, sellerId: string | null) {
    return this.configModel.findOne({ storeId, sellerId }, {}, { lean: true });
  }

  findSellerConfigByCode(storeId: string, sellerCode: string) {
    return this.configModel.findOne(
      { storeId, sellerCode },
      {},
      { lean: true },
    );
  }

  async merge(config: Partial<Config>) {
    const configPK = {
      storeId: config.storeId,
      sellerId: config.sellerId,
    };

    const configDoc = await this.configModel.findOne(configPK);
    if (!configDoc) {
      // eslint-disable-next-line new-cap
      const new_config = new this.configModel(config);
      await new_config.save();
    } else {
      const update = { $set: { active: config.active } };
      await this.configModel.findOneAndUpdate(configPK, update, {
        runValidators: true,
        useFindAndModify: false,
      });
    }
  }
}
