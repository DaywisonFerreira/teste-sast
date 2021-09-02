import { models } from 'ihub-framework-ts';
import { BaseRepository } from '../../../common/repositories/baseRepository';
import { Order } from '../interfaces/Order';

export class OrderRepository extends BaseRepository<Order> {
    constructor() {
        super(models.Order);
    }
}
