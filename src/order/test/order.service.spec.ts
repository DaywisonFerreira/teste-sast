import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { HttpException, HttpStatus } from '@nestjs/common';
import { OrderService } from '../order.service';
import { OrderDocument, OrderEntity } from '../schemas/order.schema';
import { ordersEntityMock } from './mocks/orders-entity.mock';
import { OrdersProvidersMock } from './providers/orders-providers.test';
import { infraLoggerMock } from './mocks/infra-logger.mock';

describe('OrderService', () => {
  let service: OrderService;
  let model: Model<OrderDocument>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: OrdersProvidersMock,
    }).compile();

    service = await moduleRef.resolve(OrderService);
    model = moduleRef.get(getModelToken(OrderEntity.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(model).toBeDefined();
  });

  describe('Read orders', () => {
    it('Should list orders with paginate properties', async () => {
      const data = {
        page: 1,
        pageSize: 20,
        orderBy: 'orderCreatedAt',
        orderDirection: 'desc',
        search: 'TST-1261870112646-02',
        storeId: '617c0034876900002773c508',
        orderCreatedAtFrom: '2022-09-14',
        orderCreatedAtTo: undefined,
        shippingEstimateDateFrom: '2022-09-19',
        shippingEstimateDateTo: undefined,
        statusCode: 'delivered',
      };

      expect(await service.findAll(data)).toStrictEqual([
        [ordersEntityMock],
        1,
      ]);

      expect(
        await service.findAll({
          ...data,
          orderCreatedAtTo: '2022-09-15',
          shippingEstimateDateTo: '2022-09-20',
          orderDirection: 'asc',
        }),
      ).toStrictEqual([[ordersEntityMock], 1]);
    });

    it('Should export data', async () => {
      const spyServiceCreateCsvLocally = jest
        .spyOn(service as any, 'createCsvLocally')
        .mockImplementation(() => Promise.resolve('') as any);

      const spyServiceCreateXlsxLocally = jest
        .spyOn(service as any, 'createXlsxLocally')
        .mockImplementation(() => Promise.resolve('') as any);

      const data = {
        orderCreatedAtFrom: '2022-09-14',
        orderCreatedAtTo: undefined,
        type: 'csv',
        storeId: '617c0034876900002773c508',
      };

      expect(
        await service.exportData(
          data,
          '632376aba8900e002a262924',
          infraLoggerMock,
        ),
      ).toStrictEqual('');

      expect(
        await service.exportData(
          { ...data, orderCreatedAtTo: '2022-09-15' },
          '632376aba8900e002a262924',
          infraLoggerMock,
        ),
      ).toStrictEqual('');

      expect(
        await service.exportData(
          { ...data, type: 'xlsx' },
          '632376aba8900e002a262924',
          infraLoggerMock,
        ),
      ).toStrictEqual('');

      expect(
        await service.exportData(
          { ...data, type: 'xlsx', orderCreatedAtTo: '2022-09-15' },
          '632376aba8900e002a262924',
          infraLoggerMock,
        ),
      ).toStrictEqual('');

      expect(spyServiceCreateCsvLocally).toBeCalledTimes(2);
      expect(spyServiceCreateXlsxLocally).toBeCalledTimes(2);
    });
  });

  describe('Read one order', () => {
    it('Should return the order', async () => {
      expect(await service.findOne('632376aba8900e002a262924')).toStrictEqual(
        ordersEntityMock,
      );

      expect(await service.findOne('test')).toStrictEqual(ordersEntityMock);
    });

    it('Should return an error: Order not found', async () => {
      const spyOrderFindOne = jest
        .spyOn(model, 'findOne')
        .mockImplementationOnce(
          () =>
            ({
              lean: () => Promise.resolve(null),
            } as any),
        );

      try {
        await service.findOne('632376aba8900e002a262924');
      } catch (error) {
        expect(error).toStrictEqual(
          new HttpException('Order not found', HttpStatus.NOT_FOUND),
        );
      }
      expect(spyOrderFindOne).toBeCalledTimes(3);
    });

    it('Should find by key and orderSale', async () => {
      expect(
        await service.findByKeyAndOrderSale(
          '31220915427207003094650010000009221051951564',
          'TST-1261870112646-02',
        ),
      ).toStrictEqual(ordersEntityMock);
    });
  });
});
