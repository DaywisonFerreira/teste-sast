/* eslint-disable no-prototype-builtins */
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, QueryOptions } from 'mongoose';
import { LogProvider } from 'src/commons/providers/log/log-provider.interface';
import { IFilterObject } from '../commons/interfaces/filter-object.interface';
import { AccountMapper } from './mappers/accountMapper';
import {
  AccountDocument,
  AccountEntity,
  AccountTypeEnum,
} from './schemas/account.schema';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(AccountEntity.name)
    private accountModel: Model<AccountDocument>,
    @Inject('LogProvider')
    private readonly logger: LogProvider,
  ) {
    this.logger.instanceLogger(AccountService.name);
  }

  async create(accountData): Promise<void> {
    this.logger.log(`Create Account with --- Request received: ${accountData}`);
    const mapData = AccountMapper.mapAccountCreated(accountData);

    const alreadyExist = await this.accountModel
      .findOne({ id: accountData.id })
      .lean();

    if (alreadyExist) {
      this.logger.error(new Error(`Account ${accountData.id} already exists`));
      return;
    }

    // eslint-disable-next-line new-cap
    const accountToSave = new this.accountModel(mapData);
    await accountToSave.save();
    await this.findAndUpdateLocation(accountData.id);
  }

  async update(
    id: string,
    accountData: any,
  ): Promise<LeanDocument<AccountEntity>> {
    const account = await this.accountModel.findOne({ id });

    const mapData = AccountMapper.mapAccountUpdated(account, accountData);

    await this.findAndUpdateLocation(id);

    return this.accountModel
      .findOneAndUpdate({ id }, mapData as AccountDocument, {
        timestamps: true,
        new: true,
        upsert: true,
      })
      .lean();
  }

  async createLocation(accountId: string, locationData): Promise<void> {
    this.logger.log(
      `Create Location with X-Tenant-Id: ${accountId} -- Request received: ${locationData}`,
    );

    const account = await this.accountModel.findOne(
      {
        id: accountId,
        accountType: AccountTypeEnum.account,
      },
      { id: 1, name: 1 },
    );

    if (!account) {
      this.logger.error(new Error(`Account ${accountId} not found`));
    }

    const mapData = AccountMapper.mapAccountLocationCreated(
      account,
      locationData,
      accountId,
    );

    const alreadyExist = await this.accountModel
      .findOne({ id: locationData.id })
      .lean();

    if (alreadyExist) {
      this.logger.error(
        new Error(`Location ${locationData.id} already exists`),
      );
      throw new HttpException(
        'Location already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    // eslint-disable-next-line new-cap
    const accountToSave = new this.accountModel(mapData);
    await accountToSave.save();
  }

  async findAll(
    { name, shipToAddress, accountType, locationId },
    page: number,
    perPage: number,
    orderBy: string,
    orderDirection: string,
  ): Promise<[AccountEntity[], number]> {
    const filter: IFilterObject = {
      active: true,
    };

    if (shipToAddress) {
      filter.shipToAddress = shipToAddress.toString().toLowerCase() === 'true';
    }

    if (name) {
      const regexTerm = new RegExp(name, 'i');
      filter.name = regexTerm;
    }

    if (accountType) {
      filter.accountType = accountType;
    }

    if (locationId) {
      filter.accountType = 'location';
      filter.id = locationId;
    }

    const sortBy = { [orderBy]: orderDirection === 'asc' ? 1 : -1 };
    const count = await this.accountModel.countDocuments(filter);
    const result = await this.accountModel
      .find(filter, {
        _id: 0,
        __v: 0,
      })
      .limit(perPage)
      .skip(perPage * (page - 1))
      .sort(sortBy);

    return [result, count];
  }

  async findAndUpdateLocation(accountId: string) {
    this.logger.log(
      `Update location without association - X-Tenant-Id: ${accountId}`,
    );

    try {
      const account = await this.accountModel.findOne(
        {
          id: accountId,
          accountType: AccountTypeEnum.account,
        },
        { id: 1, name: 1 },
      );

      if (account) {
        const findAndUpdateLocation = await this.accountModel
          .findOneAndUpdate(
            {
              account: { id: accountId, name: '' },
              accounts: [],
            },
            {
              $push: {
                accounts: account,
              },
              $set: {
                account,
              },
            },
          )
          .lean();
        this.logger.log(`Updated location: ${findAndUpdateLocation.id}`);
      }
    } catch (error) {
      this.logger.error(new Error(`Error when update location - ${error}`));
    }
  }

  async find(filter: Record<string, any>, options?: QueryOptions) {
    return this.accountModel.find(filter, {}, options);
  }

  async findOneAccountOrLocation(id: string, accountType: string) {
    const account = await this.accountModel
      .findOne(
        { id, accountType },
        {
          _id: 0,
          __v: 0,
        },
      )
      .lean();

    return account;
  }

  async findOneLocationByDocument(document: string, accountId: string) {
    const account = await this.accountModel
      .findOne(
        {
          'accounts.id': accountId,
          document: document
            .replace(/-/g, '')
            .replace(/\./g, '')
            .replace(/\//g, ''),
          accountType: AccountTypeEnum.location,
        },
        {
          _id: 0,
          __v: 0,
        },
      )
      .lean();

    if (!account) {
      throw new HttpException('Location not found.', HttpStatus.NOT_FOUND);
    }

    return account;
  }

  async updateWarehouseCode(
    id: string,
    externalWarehouseCode: Partial<LeanDocument<AccountEntity>>,
  ) {
    const location = await this.accountModel.findOne({
      id,
      accountType: AccountTypeEnum.location,
    });

    if (!location) {
      throw new HttpException('Location not found.', HttpStatus.NOT_FOUND);
    }
    return this.accountModel.findOneAndUpdate({ id }, externalWarehouseCode, {
      timestamps: true,
      lean: true,
      new: true,
      projection: { __v: 0, _id: 0 },
    });
  }

  async updateGenerateNotfisFile(
    id: string,
    updateData: Partial<LeanDocument<AccountEntity>>,
  ) {
    const account = await this.accountModel.findOne({
      id,
      accountType: AccountTypeEnum.account,
    });
    if (!account) {
      throw new HttpException('Account not found.', HttpStatus.NOT_FOUND);
    }
    return this.accountModel.findOneAndUpdate({ id }, updateData, {
      timestamps: true,
      lean: true,
      new: true,
      projection: { __v: 0, _id: 0 },
    });
  }

  async findById(id: string): Promise<LeanDocument<AccountEntity>> {
    const account = await this.accountModel
      .findOne({ id, active: true })
      .lean();
    if (!account) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
    return account;
  }
}
