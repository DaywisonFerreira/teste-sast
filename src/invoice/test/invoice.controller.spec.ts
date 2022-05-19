import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CarrierService } from 'src/carrier/carrier.service';
import { CarrierEntity } from 'src/carrier/schemas/carrier.schema';
import { NestjsEventEmitter } from 'src/commons/providers/event/nestjs-event-emitter';
import { TrackingCodeEntity } from '../schemas/tracking-code.schema';
import { AccountEntity } from '../../account/schemas/account.schema';
import { ConsumerInvoiceController } from '../consumer/invoice.controller';
import { InvoiceService } from '../invoice.service';
import { AccountService } from '../../account/account.service';

describe('ConsumerInvoiceController', () => {
  let controller: ConsumerInvoiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsumerInvoiceController],
      providers: [
        InvoiceService,
        CarrierService,
        AccountService,
        {
          provide: getModelToken(CarrierEntity.name),
          useValue: {},
        },
        {
          provide: getModelToken(TrackingCodeEntity.name),
          useValue: {},
        },
        {
          provide: getModelToken(AccountEntity.name),
          useValue: {},
        },
        {
          provide: NestjsEventEmitter,
          useValue: {},
        },
        { provide: 'KafkaService', useValue: {} },
      ],
    }).compile();

    controller = module.get<ConsumerInvoiceController>(
      ConsumerInvoiceController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
