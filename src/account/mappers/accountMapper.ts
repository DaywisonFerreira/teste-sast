import { AccountEntity, AccountTypeEnum } from '../schemas/account.schema';

export class AccountMapper {
  static mapAccountCreated(payload): AccountEntity {
    return {
      ...payload,
      accountType: AccountTypeEnum.account,
      document: payload.fiscalCode
        .replace(/-/g, '')
        .replace(/\./g, '')
        .replace(/\//g, ''),
      zipCode: payload.address.zipCode.replace(/-/g, '').replace(/\./g, ''),
    };
  }

  static mapAccountLocationCreated(account, payload): AccountEntity {
    return {
      ...payload,
      accounts: account,
      accountType: AccountTypeEnum.location,
      document: payload.fiscalCode
        .replace(/-/g, '')
        .replace(/\./g, '')
        .replace(/\//g, ''),
      zipCode: payload.address.zipCode.replace(/-/g, '').replace(/\./g, ''),
    };
  }
}
