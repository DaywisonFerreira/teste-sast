import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderEntity } from 'src/order/schemas/order.schema';
import { InteliPostController } from '../intelipost.controller';
import { InteliPostService } from '../intelipost.service';

describe('InteliPostController', () => {
  let controller: InteliPostController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InteliPostController],
      providers: [
        InteliPostService,
        {
          provide: getModelToken(OrderEntity.name),
          useValue: {},
        },
        { provide: AmqpConnection, useValue: {} },
        {
          provide: 'LogProvider',
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<InteliPostController>(InteliPostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
