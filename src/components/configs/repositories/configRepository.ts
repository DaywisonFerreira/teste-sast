import { models } from 'ihub-framework-ts';

import { Config } from '../../../common/interfaces/config';

import { BaseRepository } from '../../../common/repositories/baseRepository';

export class ConfigRepository extends BaseRepository<Config> {
  constructor() {
    super(models.Configs);
  }
}
