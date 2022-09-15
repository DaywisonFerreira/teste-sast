import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AccountEntity } from 'src/account/schemas/account.schema';
import { OrderService } from 'src/order/order.service';
import { OrderEntity } from 'src/order/schemas/order.schema';
import { AccountService } from '../../account/account.service';
import { CarrierService } from '../../carrier/carrier.service';
import { CarrierEntity } from '../../carrier/schemas/carrier.schema';
import { Env } from '../../commons/environment/env';
import { InvoiceService } from '../../invoice/invoice.service';
import { InvoiceEntity } from '../../invoice/schemas/invoice.schema';
import { OnEventIntelipostController } from '../consumer/intelipost-event.controller';
import { IntelipostController } from '../intelipost.controller';
import { InteliPostService } from '../intelipost.service';
import { IntelipostMapper } from '../mappers/intelipostMapper';
import { message } from './mocks/freight.invoice.created';
import { carrier, location, account } from './mocks/result-models';

const gateway = {
  post: jest.fn(),
};
const invoiceModel = {
  updateOne: jest.fn(),
};
const accountModel = {
  findOne: jest.fn().mockReturnThis(),
  lean: jest.fn(),
};
const carrierModel = {
  findOne: jest.fn().mockReturnThis(),
  lean: jest.fn(),
};
accountModel.findOne.mockReturnThis();
accountModel.lean.mockResolvedValue(location);
carrierModel.lean.mockResolvedValue(carrier);
const secondsTimeout =
  Env.INTELIPOST_SLEEP_RESEND * Env.INTELIPOST_TOTAL_RESEND;

describe('IntelipostController', () => {
  let controller: IntelipostController;
  let constrollerEvent: OnEventIntelipostController;
  let module: TestingModule;

  beforeEach(async () => {
    gateway.post.mockResolvedValue({ status: 502 });
    module = await Test.createTestingModule({
      controllers: [IntelipostController, OnEventIntelipostController],
      providers: [
        InteliPostService,
        OrderService,
        {
          provide: getModelToken(OrderEntity.name),
          useValue: {},
        },
        {
          provide: getModelToken(AccountEntity.name),
          useValue: accountModel,
        },
        {
          provide: getModelToken(CarrierEntity.name),
          useValue: carrierModel,
        },
        {
          provide: getModelToken(InvoiceEntity.name),
          useValue: invoiceModel,
        },
        { provide: AmqpConnection, useValue: {} },
        {
          provide: 'KafkaService',
          useValue: {},
        },
        {
          provide: 'ApiGateway',
          useValue: gateway,
        },
        IntelipostMapper,
        CarrierService,
        AccountService,
        InvoiceService,
      ],
    }).compile();

    controller = module.get<IntelipostController>(IntelipostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it(
    'retry when error 502 or 429',
    async () => {
      constrollerEvent = module.get<OnEventIntelipostController>(
        OnEventIntelipostController,
      );
      await constrollerEvent.sendIntelipostData({
        data: message.data,
        account,
        headers: { 'X-Correlation-Id': 'test' },
      });
      expect(gateway.post).toHaveBeenCalledTimes(Env.INTELIPOST_TOTAL_RESEND);
      expect(constrollerEvent).toBeDefined();
    },
    secondsTimeout * 1000,
  );

  it('retry when error 400', async () => {
    gateway.post.mockClear();
    gateway.post.mockResolvedValue({
      status: 400,
      data: {
        status: 'ERROR',
        messages: [{ key: 'shipmentOrder.save.already.existing.order.number' }],
      },
    });
    constrollerEvent = module.get<OnEventIntelipostController>(
      OnEventIntelipostController,
    );
    await constrollerEvent.sendIntelipostData({
      data: message.data,
      account,
      headers: { 'X-Correlation-Id': 'test' },
    });
    expect(gateway.post).toHaveBeenCalledTimes(2);
    expect(constrollerEvent).toBeDefined();
  });
});
