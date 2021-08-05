import { Model } from 'mongoose';

/**
 * Store repository
 */
export class StoreRepository {
    model: Model<any>;
    constructor(model: Model<any>) {
        this.model = model;
    }

    /**
    * Finds one document at the database
    * @param conditions
    * @param projection 
    */
    async findOne(conditions: any, projection: any) {
        return await this.model.findOne(conditions, projection);
    }

    /**
   * Find and update a document
   * @param conditions 
   * @param update 
   * @param options 
   */
    async findOneAndUpdate(conditions: any, update: any, options: any) {
        return await this.model.findOneAndUpdate(conditions, update, options);
    }

}