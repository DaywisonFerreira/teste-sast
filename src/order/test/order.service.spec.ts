import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { OrderService } from '../order.service';
import { OrderEntity } from '../schemas/order.schema';
import { ordersEntityMock } from './mocks/orders-entity.mock';
import { OrdersProvidersMock } from './providers/orders-providers.test';

describe('OrderService', () => {
  let service: OrderService;
  let orderModel: OrderEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: OrdersProvidersMock,
    }).compile();

    service = await module.resolve(OrderService);
    orderModel = module.get(getModelToken(OrderEntity.name));
  });

  it('should be defined', () => {
    expect(orderModel).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('Read orders', () => {
    it('Should list orders with paginate properties', async () => {
      expect(
        await service.findAll({
          page: 1,
          pageSize: 20,
          orderBy: 'orderCreatedAt',
          orderDirection: 'desc',
          search: 'TST-1261870112646-02',
          storeId: '617c0034876900002773c508',
          orderCreatedAtFrom: '2022-09-14',
          orderCreatedAtTo: '2022-09-15',
          shippingEstimateDateFrom: '2022-09-19',
          shippingEstimateDateTo: '2022-09-20',
          statusCode: 'delivered',
        }),
      ).toStrictEqual([[ordersEntityMock], 1]);
    });
  });
});
