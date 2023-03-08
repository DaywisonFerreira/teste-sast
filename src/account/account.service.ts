/* eslint-disable no-prototype-builtins */
import { LogProvider } from 'src/commons/providers/log/log-provider.interface';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, QueryOptions } from 'mongoose';
import { IFilterObject } from '../commons/interfaces/filter-object.interface';
import {
  AccountDocument,
  AccountEntity,
  AccountTypeEnum,
} from './schemas/account.schema';
import { AccountMapper } from './mappers/accountMapper';

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
    const mapData = {
      ...accountData,
      document: accountData.fiscalCode
        .replace(/-/g, '')
        .replace(/\./g, '')
        .replace(/\//g, ''),
      zipCode: accountData.address.zipCode.replace(/-/g, '').replace(/\./g, ''),
    };

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
  }

  async update(
    id: string,
    accountData: any,
  ): Promise<LeanDocument<AccountEntity>> {
    const account = await this.accountModel.findOne({ id });

    const mapData = {
      ...accountData,
      document: accountData.fiscalCode
        .replace(/-/g, '')
        .replace(/\./g, '')
        .replace(/\//g, ''),
      zipCode: accountData.address.zipCode.replace(/-/g, '').replace(/\./g, ''),
      useDeliveryHub:
        account && account?.toJSON().hasOwnProperty('useDeliveryHub')
          ? account.useDeliveryHub
          : false,
      useDeliveryHubStandalone:
        account && account?.toJSON().hasOwnProperty('useDeliveryHubStandalone')
          ? account.useDeliveryHubStandalone
          : false,
    };

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

    const mapData = AccountMapper.mapAccount(accountId, locationData);

    const account = await this.accountModel.findOne(
      {
        id: accountId,
        accountType: AccountTypeEnum.account,
      },
      { id: 1, name: 1 },
    );

    if (!account) {
      this.logger.error(new Error(`Account ${accountId} not found`));
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }

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

  async associateLocation(
    accountId: string,
    locationId: string,
  ): Promise<AccountEntity> {
    const location = await this.accountModel.findOne({
      id: locationId,
      accountType: AccountTypeEnum.location,
    });

    const account = await this.accountModel.findOne(
      {
        id: accountId,
        accountType: AccountTypeEnum.account,
      },
      { id: 1, name: 1 },
    );

    if (!location || !account) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }

    // const alreadyHasAccount = location.accounts.find(
    //   accountAssociated => accountAssociated.id === account.id,
    // );

    // if (alreadyHasAccount) {
    //   throw new HttpException('Already associated', HttpStatus.BAD_REQUEST);
    // }

    return this.accountModel.findOneAndUpdate(
      { id: location.id, accountType: AccountTypeEnum.location },
      {
        $push: {
          accounts: account,
        },
      },
    );
  }

  async unassociateLocation(accountId: string, locationId: string) {
    await this.accountModel.findOneAndUpdate(
      { id: locationId, accountType: AccountTypeEnum.location },
      {
        $pull: {
          accounts: { id: accountId },
        },
      },
    );
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
