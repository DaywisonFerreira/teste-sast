import { getModelToken } from '@nestjs/mongoose';
import { InfraLogger } from 'src/commons/providers/log/infra-logger';

import { AccountEntity } from '../../../account/schemas/account.schema';
import { OrderService } from '../../order.service';
import { OrderEntity } from '../../schemas/order.schema';
import { OrdersModelMock } from './orders-model.mock';

export const OrdersProvidersMock = [
  OrderService,
  {
    provide: getModelToken(OrderEntity.name),
    useValue: OrdersModelMock,
  },
  {
    provide: getModelToken(AccountEntity.name),
    useValue: {},
  },
  {
    provide: 'LogProvider',
    useClass: InfraLogger,
  },
  { provide: 'KafkaService', useValue: { send: () => null } },
];
