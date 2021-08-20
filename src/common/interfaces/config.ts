import { common } from 'ihub-framework-ts';

export class Config extends common.Types.BaseEntity {
  active: boolean;

  /**
  * List of standard public fields for this entity. Commonly used for return in APIs.
  */
  static getPublicFields = [
    'active',
  ];
}