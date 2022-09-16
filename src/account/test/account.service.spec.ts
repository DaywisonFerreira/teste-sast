import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import faker from '@faker-js/faker';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AccountService } from '../account.service';
import {
  AccountDocument,
  AccountEntity,
  AccountTypeEnum,
} from '../schemas/account.schema';

export const mockAccount = (): AccountEntity =>
  ({
    id: '0a2fe1ed-4148-4838-a1f1-18ef13284374',
    icon: '',
    name: 'Account Name',
    zipCode: '41545-874',
    code: '0548949684169',
    active: true,
    document: '20.612.212/0001-37',
    accountType: AccountTypeEnum.account,
    shipToAddress: false,
    accounts: [
      {
        id: '0a2fe1ed-4148-4838-a1f1-18ef13284374',
        name: 'Account Name',
      },
    ],
    salesChannels: ['0a2fe1ed-4148-4838-a1f1-18ef13284374'],
  } as AccountEntity);

class MockAccountModel {
  constructor(public data: any) {}

  save = jest.fn().mockResolvedValue(() => {
    return { ...this.data, toJSON: () => mockAccount() };
  });

  static findOne = () => {
    return {
      ...mockAccount(),
      lean: () => mockAccount(),
    };
  };

  static findOneAndUpdate = () => {
    return {
      lean: () => mockAccount(),
    };
  };

  static find = () => {
    return {
      limit: () => {
        return {
          skip: () => {
            return {
              sort: () => [mockAccount()],
            };
          },
        };
      },
    };
  };

  static countDocuments = jest.fn().mockResolvedValue(1);
}

type SutTypes = {
  sut: AccountService;
  AccountModel: Model<AccountDocument>;
};

const makeSut = async (): Promise<SutTypes> => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      AccountService,
      {
        provide: getModelToken(AccountEntity.name),
        useValue: MockAccountModel,
      },
    ],
  }).compile();

  const sut = module.get<AccountService>(AccountService);
  const AccountModel = module.get(getModelToken(AccountEntity.name));

  return { sut, AccountModel };
};

describe('AccountService', () => {
  test('should create an account with success', async () => {
    const { sut, AccountModel } = await makeSut();

    jest.spyOn(AccountModel, 'findOne').mockImplementationOnce((): any => {
      return {
        lean: jest.fn().mockReturnValue(null),
      };
    });

    const mockedAccount = mockAccount();

    expect(
      await sut.create({
        ...mockedAccount,
        fiscalCode: faker.datatype.string(),
        address: {
          zipCode: faker.datatype.string(),
        },
      }),
    ).toBeUndefined();
  });

  test('Should not create an account because it already exists', async () => {
    const { sut, AccountModel } = await makeSut();

    jest.spyOn(AccountModel, 'findOne').mockImplementationOnce((): any => {
      return {
        lean: jest.fn().mockReturnValue(mockAccount()),
      };
    });

    const mockedAccount = mockAccount();

    expect(
      await sut.create({
        ...mockedAccount,
        fiscalCode: faker.datatype.string(),
        address: {
          zipCode: faker.datatype.string(),
        },
      }),
    ).toBeUndefined();
  });

  test('should update an account with success', async () => {
    const { sut } = await makeSut();

    const mockedAccount = mockAccount();

    const response = await sut.update(mockedAccount.id, {
      ...mockedAccount,
      fiscalCode: faker.datatype.string(),
      address: {
        zipCode: faker.datatype.string(),
      },
    });

    expect(response).toEqual(mockedAccount);
  });

  test('should associate a location with success', async () => {
    const { sut, AccountModel } = await makeSut();

    const mockedAccount = mockAccount();

    jest.spyOn(AccountModel, 'findOne').mockReturnValueOnce({
      ...mockedAccount,
      accountType: 'location',
      accounts: [],
    } as any);

    jest
      .spyOn(AccountModel, 'findOneAndUpdate')
      .mockImplementationOnce((): any => mockedAccount);

    const response = await sut.associateLocation(
      mockedAccount.id,
      mockedAccount.id,
    );

    expect(response).toEqual(mockedAccount);
  });

  test('Should not associate a location and return an error: Account not found', async () => {
    const { sut, AccountModel } = await makeSut();

    const mockedAccount = mockAccount();

    jest.spyOn(AccountModel, 'findOne').mockImplementationOnce((): any => null);

    try {
      await sut.associateLocation(mockedAccount.id, mockedAccount.id);
    } catch (error) {
      expect(error).toStrictEqual(
        new HttpException('Account not found', HttpStatus.NOT_FOUND),
      );
    }
  });

  test('Should not associate a location and return an error: Already associated', async () => {
    const { sut, AccountModel } = await makeSut();

    const mockedAccount = mockAccount();

    jest.spyOn(AccountModel, 'findOne').mockReturnValueOnce({
      ...mockedAccount,
      accountType: 'location',
    } as any);

    try {
      await sut.associateLocation(mockedAccount.id, mockedAccount.id);
    } catch (error) {
      expect(error).toStrictEqual(
        new HttpException('Already associated', HttpStatus.BAD_REQUEST),
      );
    }
  });

  test('should return an array of accounts and countDocuments', async () => {
    const { sut } = await makeSut();

    const mockedAccount = mockAccount();

    const response = await sut.findAll(
      {
        name: 'test',
        shipToAddress: 'true',
        accountType: 'account',
        locationId: '0a2fe1ed-4148-4838-a1f1-18ef13284374',
      },
      1,
      20,
      null,
      'asc',
    );

    expect(response).toEqual([[mockedAccount], 1]);
  });
});