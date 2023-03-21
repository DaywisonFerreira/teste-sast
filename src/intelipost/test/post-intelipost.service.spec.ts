import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AccountEntity } from 'src/account/schemas/account.schema';
import { CarrierService } from 'src/carrier/carrier.service';
import { CarrierEntity } from 'src/carrier/schemas/carrier.schema';
import { InfraLogger } from 'src/commons/providers/log/infra-logger';
import { InvoiceService } from 'src/invoice/invoice.service';
import { InvoiceEntity } from 'src/invoice/schemas/invoice.schema';
import { OrderService } from 'src/order/order.service';
import { OrderProducer } from 'src/order/producer/order.producer';
import { OrderEntity } from 'src/order/schemas/order.schema';
import { InteliPostService } from '../intelipost.service';

describe('InteliPostService', () => {
  let service: InteliPostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InteliPostService,
        OrderService,
        OrderProducer,
        CarrierService,
        InvoiceService,
        {
          provide: getModelToken(OrderEntity.name),
          useValue: {},
        },
        {
          provide: getModelToken(InvoiceEntity.name),
          useValue: {},
        },
        {
          provide: getModelToken(CarrierEntity.name),
          useValue: {},
        },
        {
          provide: getModelToken(AccountEntity.name),
          useValue: {},
        },
        {
          provide: AmqpConnection,
          useValue: {},
        },
        {
          provide: 'KafkaService',
          useValue: {},
        },
        {
          provide: 'LogProvider',
          useClass: InfraLogger,
        },
      ],
    }).compile();

    service = module.get<InteliPostService>(InteliPostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
