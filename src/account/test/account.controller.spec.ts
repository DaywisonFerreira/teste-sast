import faker from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from '../account.controller';
import { AccountService } from '../account.service';
import { FilterPaginateAccountDto } from '../dto/filter-paginate-account.dto';
import { PaginateAccountDto } from '../dto/paginate-account.dto';
import { AccountServiceSpy, mockAccounts } from './mock';

type SutTypes = {
  sut: AccountController;
  accountServiceSpy: AccountServiceSpy;
};

const makeSut = async (): Promise<SutTypes> => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      AccountController,
      { provide: AccountService, useClass: AccountServiceSpy },
    ],
  }).compile();

  const sut = module.get<AccountController>(AccountController);
  const accountServiceSpy = module.get<AccountService>(
    AccountService,
  ) as unknown as AccountServiceSpy;
  return { sut, accountServiceSpy };
};

describe('AccountController', () => {
  test('should be return the correct response when fetching all contracts', async () => {
    const { sut, accountServiceSpy } = await makeSut();

    const mockedAccounts = mockAccounts();
    accountServiceSpy.accounts = mockedAccounts;

    const query: FilterPaginateAccountDto = {
      name: faker.datatype.string(),
      shipToAddress: faker.datatype.boolean(),
      accountType: faker.datatype.string(),
      locationId: faker.datatype.string(),
    };

    const response = await sut.findAll(query);

    expect(accountServiceSpy.accounts).toHaveLength(mockedAccounts.length);
    expect(response).toEqual(
      new PaginateAccountDto(
        JSON.parse(JSON.stringify(mockedAccounts)),
        mockedAccounts.length,
        Math.abs(1),
        Math.abs(20),
      ),
    );
  });
});
