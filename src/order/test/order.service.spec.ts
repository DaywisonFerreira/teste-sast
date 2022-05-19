import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AccountEntity } from 'src/account/schemas/account.schema';
import { OrderService } from '../order.service';
import { OrderEntity } from '../schemas/order.schema';

describe('OrderService', () => {
  let service: OrderService;
  let orderModel: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getModelToken(OrderEntity.name),
          useValue: {},
        },
        {
          provide: getModelToken(AccountEntity.name),
          useValue: {},
        },
        { provide: 'KafkaService', useValue: {} },
      ],
    }).compile();

    service = await module.resolve(OrderService);
    orderModel = module.get(getModelToken(OrderEntity.name));
  });

  it('should be defined', () => {
    expect(orderModel).toBeDefined();
    expect(service).toBeDefined();
  });
});
