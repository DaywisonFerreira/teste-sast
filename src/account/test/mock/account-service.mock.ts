import faker from '@faker-js/faker';
import { AccountEntity, AccountTypeEnum } from '../../schemas/account.schema';

export class AccountServiceSpy {
  accounts: AccountEntity[] = [];

  findAll(): Promise<[AccountEntity[], number]> {
    return Promise.resolve([this.accounts, this.accounts.length]);
  }

  findAllAccountsLocations(): Promise<AccountEntity[]> {
    const location = this.accounts.filter(
      acc => acc.accountType === AccountTypeEnum.location,
    );
    return Promise.resolve(location);
  }
}

export const mockAccount = (): AccountEntity =>
  ({
    id: faker.datatype.uuid(),
    icon: faker.datatype.string(),
    name: faker.datatype.string(),
    zipCode: faker.datatype.string(),
    address: {
      city: faker.datatype.string(),
      state: faker.datatype.string(),
      neighborhood: faker.datatype.string(),
      zipCode: faker.datatype.string(),
    },
    active: faker.datatype.boolean(),
    document: faker.datatype.string(),
    accountType:
      AccountTypeEnum[
        Math.floor(Math.random() * Object.keys(AccountTypeEnum).length)
      ],
    shipToAddress: faker.datatype.boolean(),
    accounts: [],
    salesChannels: [faker.datatype.string()],
  } as AccountEntity);

export const mockAccounts = (): AccountEntity[] => [
  mockAccount(),
  mockAccount(),
  mockAccount(),
  mockAccount(),
  mockAccount(),
];
