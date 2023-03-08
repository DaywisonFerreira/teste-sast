import { AccountEntity } from '../schemas/account.schema';

export class AccountMapper {
  static mapAccount(accountId, payload): AccountEntity {
    return {
      ...payload,
      accounts: payload.accountIDs,
      document: payload.fiscalCode
        .replace(/-/g, '')
        .replace(/\./g, '')
        .replace(/\//g, ''),
      zipCode: payload.address.zipCode.replace(/-/g, '').replace(/\./g, ''),
    };
  }
}
