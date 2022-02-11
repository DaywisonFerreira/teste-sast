import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderEntity } from '../../order/schemas/order.schema';
import { StoreService } from '../store.service';

describe('StoresService', () => {
  let service: StoreService;
  let orderModel: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreService,
        {
          provide: getModelToken(OrderEntity.name),
          useValue: {},
        },
        {
          provide: 'LogProvider',
          useValue: {},
        },
      ],
    }).compile();

    service = await module.resolve(StoreService);
    orderModel = module.get(getModelToken(OrderEntity.name));
  });

  it('should be defined', () => {
    expect(orderModel).toBeDefined();
    expect(service).toBeDefined();
  });
});
