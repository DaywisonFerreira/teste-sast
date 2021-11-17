import { common, errors } from 'ihub-framework-ts';
import { Model } from 'mongoose';

// Errors
const { ResourceConflictError } = errors;

export abstract class BaseRepository<T extends common.Types.BaseEntity> {
    private readonly model: Model<T>;

    constructor(model: Model<T>) {
        this.model = model;
    }

    async insertMany(docs: T[]): Promise<T[]> {
        return await this.model.insertMany(docs);
    }

    async save(entity: T, options: any = {}): Promise<T> {
        try {
            const model = new this.model(entity);
            return (await model.save(options)) as T;
        } catch (error) {
            // Checks if it is a duplicate error
            if (error?.code === 11000) {
                throw new ResourceConflictError();
            } else {
                throw error;
            }
        }
    }

    async find(
        conditions: any = {},
        projection: any = {},
        options: any = {}
    ): Promise<T[]> {
        return await this.model.find(conditions, projection, options);
    }

    async create(data: any) {
        return await this.model.create(data);
    }

    async findOne(
        conditions: any = {},
        projection: any = {},
        options: any = {}
    ): Promise<T> {
        return await this.model.findOne(conditions, projection, options);
    }

    async findOneAndUpdate(
        conditions: any = {},
        update: any = {},
        options: any = {}
    ): Promise<T> {
        return await this.model.findOneAndUpdate(conditions, update, options);
    }

    async updateOne(conditions: any, doc: any, options: any = {}): Promise<T> {
        return await this.model.updateOne(conditions, doc, options);
    }

    async updateMany(
        conditions: any,
        doc: any,
        options: any = {}
    ): Promise<T[]> {
        return await this.model.updateMany(conditions, doc, options);
    }

    async deleteOne(conditions: any, options: any = {}): Promise<boolean> {
        const result = await this.model.deleteOne(conditions, options);
        return result.deletedCount === 1;
    }

    async exists(filter: any): Promise<boolean> {
        return await this.model.exists(filter);
    }

    async distinct(field: string, filter?: any): Promise<string[]> {
        return await this.model.distinct(field, filter);
    }

    async countDocuments(filter: any): Promise<number> {
        return await this.model.countDocuments(filter);
    }

    async merge(
        configPK: any,
        data: any = {},
        options: any = { runValidators: true, useFindAndModify: false }
    ) {
        const response = await this.model.findOne(configPK);
        if (!response) {
            await this.model.create(data);
        } else {
            await this.model.findOneAndUpdate(configPK, data, options);
        }
    }

    /**
     *
     * @param filter
     * @param fields
     * @param options
     * @param paginationParams
     */
    async pagination(
        filter: any,
        fields: any,
        options: any,
        paginationParams: common.Types.PaginationParams
    ): Promise<common.Types.PaginatedResponseParams<T>> {
        const {
            pageNumber = 1,
            perPage,
            orderBy,
            orderDirection = 'asc',
        } = paginationParams;

        // Defining sort and direction
        const sort = orderBy
            ? { [orderBy]: orderDirection === 'desc' ? -1 : 1 }
            : {};
        // Definition of offset
        const skip = pageNumber > 0 ? (pageNumber - 1) * perPage : 0;
        // Removing fields undefined
        Object.keys(filter).forEach((key) => {
            if (filter[key] === undefined) delete filter[key];
        });
        // Data and it count total
        const [data, total] = await Promise.all([
            this.model
                .find(filter, fields, { ...options })
                .sort(sort)
                .skip(skip)
                .limit(perPage)
                .exec(),
            this.model.find(filter).countDocuments().exec(),
        ]);

        const paginatedResponse = {} as common.Types.PaginatedResponseParams<T>;
        paginatedResponse.currentPage = pageNumber;
        paginatedResponse.itemsPerPage = perPage;
        paginatedResponse.totalItems = total;
        paginatedResponse.data = data;

        return paginatedResponse;
    }
}
