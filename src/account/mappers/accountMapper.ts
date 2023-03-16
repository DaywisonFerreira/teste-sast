/* eslint-disable no-prototype-builtins */
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
      address: {
        city: payload.address.city,
        state: payload.address.state,
        zipcode: payload.address.zipCode.replace(/-/g, '').replace(/\./g, ''),
        neighborhood: payload.address.neighborhood,
        country: payload.address.country,
        street: payload.address.street,
        number: payload.address.number,
        complement: payload.address.complement,
      },
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
      address: {
        city: payload.address.city,
        state: payload.address.state,
        zipcode: payload.address.zipCode.replace(/-/g, '').replace(/\./g, ''),
        neighborhood: payload.address.neighborhood,
        country: payload.address.country,
        street: payload.address.street,
        number: payload.address.number,
        complement: payload.address.complement,
      },
    };
  }

  static mapAccountUpdated(account, payload): AccountEntity {
    return {
      ...payload,
      document: payload.fiscalCode
        .replace(/-/g, '')
        .replace(/\./g, '')
        .replace(/\//g, ''),
      zipCode: payload.address.zipCode.replace(/-/g, '').replace(/\./g, ''),
      address: {
        city: payload.address.city,
        state: payload.address.state,
        zipcode: payload.address.zipCode.replace(/-/g, '').replace(/\./g, ''),
        neighborhood: payload.address.neighborhood,
        country: payload.address.country,
        street: payload.address.street,
        number: payload.address.number,
        complement: payload.address.complement,
      },
      useDeliveryHub:
        account && account?.toJSON().hasOwnProperty('useDeliveryHub')
          ? account.useDeliveryHub
          : false,
      useDeliveryHubStandalone:
        account && account?.toJSON().hasOwnProperty('useDeliveryHubStandalone')
          ? account.useDeliveryHubStandalone
          : false,
    };
  }
}
