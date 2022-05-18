import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from 'src/order/order.service';
import { OrderEntity } from 'src/order/schemas/order.schema';
import { IntelipostController } from '../intelipost.controller';
import { InteliPostService } from '../intelipost.service';

describe('IntelipostController', () => {
  let controller: IntelipostController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntelipostController],
      providers: [
        InteliPostService,
        OrderService,
        {
          provide: getModelToken(OrderEntity.name),
          useValue: {},
        },
        { provide: AmqpConnection, useValue: {} },
        {
          provide: 'KafkaService',
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<IntelipostController>(IntelipostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
