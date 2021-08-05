import { common } from 'ihub-framework-ts';

// Repositories
import { BaseRepository } from '../repositories/baseRepository';

export abstract class BaseService<Entity extends common.Types.BaseEntity, Repo extends BaseRepository<Entity>> {
    protected readonly repository: Repo;

    constructor(repository: Repo) {
        if (!repository) {
            throw new Error('A repository is required');
        }

        this.repository = repository;
    }

}
