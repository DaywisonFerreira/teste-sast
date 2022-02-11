import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, LeanDocument, Model } from 'mongoose';
import { IFilterObject } from 'src/commons/interfaces/filter-object.interface';
import {
  AccountDocument,
  AccountEntity,
  AccountTypeEnum,
} from './schemas/account.schema';

@Injectable()
export class AccountService {
  private logger = new Logger(AccountService.name);

  constructor(
    @InjectModel(AccountEntity.name)
    private accountModel: Model<AccountDocument>,
  ) {}

  async create(accountData): Promise<LeanDocument<AccountEntity>> {
    try {
      const mapData = {
        ...accountData,
        document: accountData.fiscalCode,
        zipCode: accountData.address.zipCode,
      };

      const alreadyExist = await this.accountModel
        .findOne({ id: accountData.id })
        .lean();

      if (alreadyExist) {
        throw new HttpException(
          'Account already exist',
          HttpStatus.BAD_REQUEST,
        );
      }

      // eslint-disable-next-line new-cap
      const accountToSave = new this.accountModel(mapData);
      const accountSaved = await accountToSave.save();
      return accountSaved.toJSON();
    } catch (error) {
      let message: string;
      if (error instanceof Error) {
        message = error.message;
        this.logger.error(JSON.stringify(error.message));
      }
      throw new InternalServerErrorException(
        message || 'Internal server error',
      );
    }
  }

  async update(id: string, accountData): Promise<LeanDocument<AccountEntity>> {
    try {
      const mapData = {
        ...accountData,
        document: accountData.fiscalCode,
        zipCode: accountData.address.zipCode,
      };

      return await this.accountModel
        .findOneAndUpdate({ id }, mapData as AccountDocument, {
          timestamps: true,
          new: true,
          upsert: true,
        })
        .lean();
    } catch (error) {
      let message: string;
      if (error instanceof Error) {
        message = error.message;
        this.logger.error(JSON.stringify(error.message));
      }
      throw new InternalServerErrorException(
        message || 'Internal server error',
      );
    }
  }

  async associateLocation(accountId: string, locationId: string) {
    try {
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

      const alreadyHasAccount = location.accounts.find(
        accountAssociated => accountAssociated.id === account.id,
      );

      if (alreadyHasAccount) {
        throw new HttpException('Already associated', HttpStatus.BAD_REQUEST);
      }

      await this.accountModel.findOneAndUpdate(
        { id: location.id, accountType: AccountTypeEnum.location },
        {
          $push: {
            accounts: account,
          },
        },
      );
    } catch (error) {
      let message: string;
      if (error instanceof Error) {
        message = error.message;
        this.logger.error(JSON.stringify(error.message));
      }
      throw new InternalServerErrorException(
        message || 'Internal server error',
      );
    }
  }

  async unassociateLocation(accountId: string, locationId: string) {
    try {
      await this.accountModel.findOneAndUpdate(
        { id: locationId, accountType: AccountTypeEnum.location },
        {
          $pull: {
            accounts: { id: accountId },
          },
        },
      );
    } catch (error) {
      let message: string;
      if (error instanceof Error) {
        message = error.message;
        this.logger.error(JSON.stringify(error.message));
      }
      throw new InternalServerErrorException(
        message || 'Internal server error',
      );
    }
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

  async findAllAccountsLocations({ locationId }): Promise<AccountEntity[]> {
    const filter: IFilterObject = {
      active: true,
      accountType: 'location',
      id: locationId,
    };

    const [result] = await this.accountModel.find(filter);

    if (result?.accounts) {
      return result.accounts;
    }
    return [];
  }

  async findOne(id: string): Promise<LeanDocument<AccountEntity>> {
    const account = await this.accountModel.findOne({ id }).lean();
    if (!account) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
    try {
      return account;
    } catch (error) {
      let message: string;
      if (error instanceof Error) {
        message = error.message;
        this.logger.error(JSON.stringify(error.message));
      }
      throw new InternalServerErrorException(
        message || 'Internal server error',
      );
    }
  }

  async findByFilter(
    filter: FilterQuery<AccountDocument>,
  ): Promise<LeanDocument<AccountEntity[]>> {
    const accounts = await this.accountModel.find(filter, {
      _id: 0,
      id: 1,
      name: 1,
    });

    return accounts;
  }
}
