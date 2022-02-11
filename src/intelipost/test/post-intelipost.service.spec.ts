import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderEntity } from 'src/order/schemas/order.schema';
import { InteliPostService } from '../intelipost.service';

describe('InteliPostService', () => {
  let service: InteliPostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InteliPostService,
        {
          provide: getModelToken(OrderEntity.name),
          useValue: {},
        },
        {
          provide: AmqpConnection,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<InteliPostService>(InteliPostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
