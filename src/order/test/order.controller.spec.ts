import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { OrderController } from '../order.controller';
import { OrderService } from '../order.service';
import { OrderEntity } from '../schemas/order.schema';

describe('OrderController', () => {
  let controller: OrderController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: getModelToken(OrderEntity.name),
          useValue: {},
        },
        { provide: OrderService, useValue: {} },
        { provide: 'KafkaService', useValue: {} },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
