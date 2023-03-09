import { AccountEntity } from '../schemas/account.schema';

export class AccountMapper {
  static mapAccount(account, payload): AccountEntity {
    return {
      ...payload,
      accounts: account,
      document: payload.fiscalCode
        .replace(/-/g, '')
        .replace(/\./g, '')
        .replace(/\//g, ''),
      zipCode: payload.address.zipCode.replace(/-/g, '').replace(/\./g, ''),
    };
  }
}
