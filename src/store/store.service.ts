import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrderDocument, OrderEntity } from '../order/schemas/order.schema';

@Injectable()
export class StoreService {
  constructor(
    @InjectModel(OrderEntity.name)
    private OrderModel: Model<OrderDocument>,
  ) {}

  async findStoresOfUser(stores: Array<string>) {
    return this.OrderModel.find(
      {
        storeId: { $in: stores },
        $and: [{ active: true, sellerId: null }],
      },
      { name: 1, icon: 1, storeCode: 1, storeId: 1 },
    ).lean();
  }
}
