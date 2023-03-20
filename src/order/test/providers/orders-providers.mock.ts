import { getModelToken } from '@nestjs/mongoose';
import { CarrierService } from 'src/carrier/carrier.service';
import { CarrierEntity } from 'src/carrier/schemas/carrier.schema';
import { InfraLogger } from 'src/commons/providers/log/infra-logger';
import { InvoiceService } from 'src/invoice/invoice.service';
import { InvoiceEntity } from 'src/invoice/schemas/invoice.schema';
import { OrderProducer } from 'src/order/producer/order.producer';
import { AccountService } from '../../../account/account.service';

import { AccountEntity } from '../../../account/schemas/account.schema';
import { OrderService } from '../../order.service';
import { OrderEntity } from '../../schemas/order.schema';
import { OrdersModelMock } from './orders-model.mock';

export const OrdersProvidersMock = [
  OrderService,
  InvoiceService,
  AccountService,
  CarrierService,
  {
    provide: getModelToken(OrderEntity.name),
    useValue: OrdersModelMock,
  },
  {
    provide: getModelToken(AccountEntity.name),
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
    provide: 'LogProvider',
    useClass: InfraLogger,
  },
  { provide: 'KafkaService', useValue: { send: () => null } },
  {
    provide: OrderProducer,
    useValue: {},
  },
];
