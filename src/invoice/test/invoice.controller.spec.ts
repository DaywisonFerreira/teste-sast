import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CarrierService } from 'src/carrier/carrier.service';
import { CarrierEntity } from 'src/carrier/schemas/carrier.schema';
import { NestjsEventEmitter } from 'src/commons/providers/event/nestjs-event-emitter';
import { InvoiceController } from '../invoice.controller';
import { InvoiceService } from '../invoice.service';
import { ConfigMapper } from '../mappers/config.mapper';

describe('InvoiceController', () => {
  let controller: InvoiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceController],
      providers: [
        InvoiceService,
        CarrierService,
        {
          provide: getModelToken(CarrierEntity.name),
          useValue: {},
        },
        {
          provide: 'LogProvider',
          useValue: {},
        },
        {
          provide: NestjsEventEmitter,
          useValue: {},
        },
        { provide: 'KafkaService', useValue: {} },
        { provide: ConfigMapper, useValue: {} },
      ],
    }).compile();

    controller = module.get<InvoiceController>(InvoiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});