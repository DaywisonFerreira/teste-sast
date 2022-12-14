import { Test } from '@nestjs/testing';
import { OrderController } from '../order.controller';
import { OrdersProvidersMock } from './providers/orders-providers.mock';

const request: any = {
  headers: {
    'x-tenant-id': '61940ba2e689060011f69be1',
    'x-correlation-id': 'fakeId',
  },
  body: {
    orderCreatedAtFrom: '2021-08-26',
    orderCreatedAtTo: '2021-08-26',
    type: 'csv',
  },
  request: {
    email: 'mocked@gmail.com',
    userId: 'fakeId',
    userName: 'MockName',
  },
};

describe('OrderController', () => {
  let controller: OrderController;
  let kafkaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [OrderController],
      providers: OrdersProvidersMock,
    }).compile();

    controller = module.get<OrderController>(OrderController);
    kafkaService = await module.resolve('KafkaService');
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Export orders data', () => {
    it('should be export data', async () => {
      const spyKafka = jest.spyOn(kafkaService, 'send');
      await controller.exportOrders(
        request.body,
        request.request,
        request.headers,
      );
      expect(spyKafka).toBeCalled();
    });
  });
});
