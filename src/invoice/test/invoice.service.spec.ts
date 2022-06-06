import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CarrierService } from 'src/carrier/carrier.service';
import { CarrierEntity } from 'src/carrier/schemas/carrier.schema';
import { InvoiceService } from '../invoice.service';
import { TrackingCodeEntity } from '../schemas/tracking-code.schema';
import { InvoiceEntity } from '../schemas/invoice.schema';

describe('InvoiceService', () => {
  let service: InvoiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        CarrierService,
        {
          provide: getModelToken(CarrierEntity.name),
          useValue: {},
        },
        {
          provide: getModelToken(TrackingCodeEntity.name),
          useValue: {},
        },
        {
          provide: getModelToken(InvoiceEntity.name),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
