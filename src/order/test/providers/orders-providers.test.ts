import { getModelToken } from '@nestjs/mongoose';

import { AccountEntity } from '../../../account/schemas/account.schema';
import { OrderService } from '../../order.service';
import { OrderEntity } from '../../schemas/order.schema';
import { OrdersModelMock } from './orders-model.test';

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
  { provide: 'KafkaService', useValue: {} },
];
