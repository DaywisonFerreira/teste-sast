import { models } from 'ihub-framework-ts';

// Interfaces
import { Config } from '../../../common/interfaces/config';

// Repositories
import { BaseRepository } from '../../../common/repositories/baseRepository';

export class ConfigRepository extends BaseRepository<Config> {
  constructor() {
    super(models.Configs);
  }
}
