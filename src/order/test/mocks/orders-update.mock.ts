import { UpdateOrderDto } from '../../dto/update-order.dto';
import { ordersEntityMock } from './orders-entity.mock';

export const ordersUpdateMock: UpdateOrderDto = {
  data: {
    name: 'string',
    description: 'string',
    conditions: [
      {
        slug: 'carrier-and-deliverymode',
        values: [
          {
            carrierId: 'dafbfac3-c020-4db4-bd25-45019358de02',
            carrierName: 'Total',
            deliveryModeId: 'dafbfac3-c020-4db4-bd25-45019358de05',
            deliveryModeName: 'Normal',
          },
        ],
      },
    ],
    actions: [
      {
        slug: 'add-separation-time',
        values: [
          {
            separationTime: '2',
          },
        ],
      },
    ],
    active: true,
    priority: 1,
    startDate: '2022-09-14',
    endDate: '2022-09-14',
  },
};

export const ordersUpdatedMock = {
  ...ordersEntityMock,
};
