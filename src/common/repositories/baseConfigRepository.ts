import { common } from 'ihub-framework-ts';

import { Model } from 'mongoose';

// Interfaces
import { Config } from '../interfaces/config';

// Repositories
import { BaseRepository } from './baseRepository';

export abstract class BaseConfigRepository<T extends common.Types.BaseEntity> extends BaseRepository<common.Types.BaseEntity> {
  protected readonly config: Config;

  constructor(model: Model<any>, config: Config) {
    super(model);

    if (!config) {
      throw new Error('A config is required');
    }

    this.config = config;
  }

  get storeId() {
    return this.config?.['storeId'];
  }

  get storeCode() {
    return this.config?.['storeCode'];
  }

  get sellerId() {
    return this.config?.['sellerId'];
  }

  get sellerCode() {
    return this.config?.['sellerCode'];
  }

  get storeIsActive() {
    return this.config?.['active'];
  }

  async insertMany(entities: T[]): Promise<T[]> {
    const preparedDocs = entities.map((entity: T) => {
      return { ...entity, ...this.getConditionsWithStoreSettings(entity), } as T;
    });
    return await super.insertMany(preparedDocs) as T[];
  }

  async save(entity: T, options: any = {}): Promise<any> {
    return await super.save(this.getConditionsWithStoreSettings(entity), options);
  }

  async find(conditions: any = {}, projection: any = {}, options: any = {}): Promise<T[]> {
    return await super.find(this.getConditionsWithStoreSettings(conditions), projection, options) as T[];
  }

  async findOne(conditions: any = {}, projection: any = {}, options: any = {}): Promise<T> {
    return await super.findOne(this.getConditionsWithStoreSettings(conditions), projection, options) as T;
  }

  async findOneAndUpdate(conditions: any = {}, update: any = {}, options: any = {}): Promise<T> {
    return await super.findOneAndUpdate(this.getConditionsWithStoreSettings(conditions), update, options) as T;
  }

  async updateOne(conditions: any, doc: any, options: any = {}): Promise<T> {
    return await super.updateOne(this.getConditionsWithStoreSettings(conditions), doc, options) as T;
  }

  async updateMany(conditions: any, doc: any, options: any = {}): Promise<T[]> {
    return await super.updateMany(this.getConditionsWithStoreSettings(conditions), doc, options) as T[];
  }

  async deleteOne(conditions: any, options: any = {}): Promise<boolean> {
    return await super.deleteOne(this.getConditionsWithStoreSettings(conditions), options);
  }

  async exists(filter: any): Promise<boolean> {
    return await super.exists(this.getConditionsWithStoreSettings(filter));
  }

  async countDocuments(filter: any): Promise<number> {
    return await super.countDocuments(this.getConditionsWithStoreSettings(filter));
  }

  /**
   *
   * @param conditions
   * @param projection
   * @param options
   * @param paginationParams
   */
  async pagination(conditions: any, projection: any, options: any, paginationParams: common.Types.PaginationParams): Promise<common.Types.PaginatedResponseParams<T>> {
    return await super.pagination(this.getConditionsWithStoreSettings(conditions), projection, options, paginationParams) as common.Types.PaginatedResponseParams<T>;
  }

  private getConditionsWithStoreSettings(conditions: any): any {
    return {
      ...conditions,
      storeId: this.storeId,
      storeCode: this.storeCode,
      ...(this.sellerId ? { sellerId: this.sellerId } : {}),
      ...(this.sellerCode ? { sellerCode: this.sellerCode } : {})
    };
  }
}
