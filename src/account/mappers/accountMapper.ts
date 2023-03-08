import { AccountEntity } from '../schemas/account.schema';

export class AccountMapper {
  static mapAccount(accountId, payload): AccountEntity {
    let accId: string;
    delete payload.accounts;

    if (payload.accountType === 'location') {
      accId = accountId;
    }

    delete payload.code;
    return {
      ...payload,
      accountId: accId,
      document: payload.fiscalCode
        .replace(/-/g, '')
        .replace(/\./g, '')
        .replace(/\//g, ''),
      zipCode: payload.address.zipCode.replace(/-/g, '').replace(/\./g, ''),
    };
  }
}
