import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
// import * as fs from 'fs';
// import * as xlsx from 'xlsx';

// import { utils } from 'xlsx';
import { OrderService } from '../order.service';
import { OrderDocument, OrderEntity } from '../schemas/order.schema';
import { ordersEntityMock } from './mocks/orders-entity.mock';
import { OrdersProvidersMock } from './providers/orders-providers.mock';
import {
  attachmentMock,
  ordersUpdateMappedMock,
} from './mocks/orders-update.mock';
import { OrderMapper } from '../mappers/orderMapper';
// import { CsvMapper } from '../mappers/csvMapper';

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
        filterPartnerOrdersOrOrderSale: [],
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

      try {
        await service.findAll({
          ...data,
          orderCreatedAtTo: '2022-11-15',
          shippingEstimateDateTo: '2022-09-20',
          orderDirection: 'asc',
        });
      } catch (error) {
        expect(error).toStrictEqual(
          new Error('Date difference greater than 2 months'),
        );
      }

      try {
        await service.findAll({
          ...data,
          orderCreatedAtTo: '2022-09-10',
          shippingEstimateDateTo: '2022-09-20',
          orderDirection: 'asc',
        });
      } catch (error) {
        expect(error).toStrictEqual(new Error('Invalid range of dates'));
      }
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
        await service.exportData(data, '632376aba8900e002a262924'),
      ).toStrictEqual('');

      expect(
        await service.exportData(
          { ...data, orderCreatedAtTo: '2022-09-15' },
          '632376aba8900e002a262924',
        ),
      ).toStrictEqual('');

      expect(
        await service.exportData(
          { ...data, type: 'xlsx', orderCreatedAtTo: '2022-09-15' },
          '632376aba8900e002a262924',
        ),
      ).toStrictEqual({
        fileName: 'Status_Entregas_STORE_14092022-15092022.xlsx',
        path: undefined,
        workbook: '',
        worksheet: '',
      });

      expect(spyServiceCreateCsvLocally).toBeCalledTimes(2);
      expect(spyServiceCreateXlsxLocally).toBeCalledTimes(1);
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
  });

  describe('Supported functions to order service', () => {
    it('Should find by key and orderSale', async () => {
      expect(
        await service.findByKeyAndOrderSale(
          '31220915427207003094650010000009221051951564',
          'TST-1261870112646-02',
        ),
      ).toStrictEqual(ordersEntityMock);
    });

    it('Should return statusScale given statusCode', async () => {
      expect(
        await (service as any).getStatusScale('order-created', 'created'),
      ).toStrictEqual(0);

      expect(await (service as any).getStatusScale('', '')).toStrictEqual(1);

      expect(
        await (service as any).getStatusScale('order-dispatched', 'dispatched'),
      ).toStrictEqual(2);

      expect(
        await (service as any).getStatusScale(
          'in-transit',
          'carrier-possession',
        ),
      ).toStrictEqual(3);

      expect(
        await (service as any).getStatusScale(
          'out-of-delivery',
          'delivery-route',
        ),
      ).toStrictEqual(4);

      expect(
        await (service as any).getStatusScale(
          'check-delivery-failed',
          'operational-problem',
        ),
      ).toStrictEqual(5);

      expect(
        await (service as any).getStatusScale('delivered', 'delivered-success'),
      ).toStrictEqual(6);

      expect(
        await (service as any).getStatusScale(
          'delivery-failed',
          'shippment-returned',
        ),
      ).toStrictEqual(6);

      expect(
        (service as any).getStatusScale('canceled', 'canceled'),
      ).toStrictEqual(6);
    });

    // it('Should return file xlsx generated', async () => {
    //   const spyFsExistsSync = jest
    //     .spyOn(fs, 'existsSync')
    //     .mockImplementationOnce(() => true);

    //   const spyFsMkdirSync = jest
    //     .spyOn(fs, 'mkdirSync')
    //     .mockImplementation(() => null);

    //   const spyXlsxUtilsBookNew = jest
    //     .spyOn(utils, 'book_new')
    //     .mockImplementationOnce(() => '' as any);

    //   const spyXlsxUtilsJsonToSheet = jest
    //     .spyOn(utils, 'json_to_sheet')
    //     .mockImplementationOnce(() => '' as any);

    //   const spyXlsxUtilsBookAppendSheet = jest
    //     .spyOn(utils, 'book_append_sheet')
    //     .mockImplementation(() => null);

    //   const spyFsWriteFile = jest
    //     .spyOn(xlsx, 'writeFile')
    //     .mockImplementation(() => null);

    //   const spyXlsxUtilsSheetAddJson = jest
    //     .spyOn(utils, 'sheet_add_json')
    //     .mockImplementationOnce(() => null);

    //   const data = CsvMapper.mapOrderToCsv([ordersEntityMock]);
    //   const exportData = {
    //     orderCreatedAtFrom: '2022-09-14',
    //     orderCreatedAtTo: '2022-09-14',
    //     userId: '617c0034876900002773c508',
    //     storeCode: 'TEST',
    //   };

    //   const file = {
    //     path: '',
    //     fileName: '',
    //     worksheet: '',
    //     workbook: '',
    //   };

    //   let fileName = 'Status_Entregas_TEST_14092022-14092022.xlsx';
    //   const directory_path =
    //     process.env.NODE_ENV !== 'local'
    //       ? `${process.cwd()}/dist/tmp`
    //       : `${process.cwd()}/src/tmp`;

    //   expect(
    //     await (service as any).createXlsxLocally(
    //       data,
    //       exportData,
    //       file.fileName,
    //       file.workbook,
    //       file.worksheet,
    //       true,
    //     ),
    //   ).toStrictEqual({
    //     ...file,
    //     fileName,
    //     path: `${directory_path}/${fileName}`,
    //   });

    //   const spyFsExistsSyncFalse = jest
    //     .spyOn(fs, 'existsSync')
    //     .mockImplementationOnce(() => false);

    //   expect(
    //     await (service as any).createXlsxLocally(
    //       data,
    //       exportData,
    //       file.fileName,
    //       'test',
    //       file.worksheet,
    //       true,
    //     ),
    //   ).toStrictEqual({
    //     ...file,
    //     fileName,
    //     workbook: 'test',
    //     path: `${directory_path}/${fileName}`,
    //   });

    //   fileName = 'Status_Entregas__14092022-14092022.xlsx';

    //   expect(
    //     await (service as any).createXlsxLocally(
    //       data,
    //       { ...exportData, storeCode: null },
    //       null,
    //       'test',
    //       file.worksheet,
    //       true,
    //     ),
    //   ).toStrictEqual({
    //     ...file,
    //     fileName,
    //     workbook: 'test',
    //     path: `${directory_path}/${fileName}`,
    //   });

    //   expect(spyFsExistsSync).toBeCalledTimes(3);
    //   expect(spyFsExistsSyncFalse).toBeCalledTimes(3);
    //   expect(spyFsMkdirSync).toBeCalledTimes(2);
    //   expect(spyXlsxUtilsBookNew).toBeCalledTimes(1);
    //   expect(spyXlsxUtilsJsonToSheet).toBeCalledTimes(1);
    //   expect(spyXlsxUtilsBookAppendSheet).toBeCalledTimes(3);
    //   expect(spyFsWriteFile).toBeCalledTimes(3);
    //   expect(spyXlsxUtilsSheetAddJson).toBeCalledTimes(2);
    // });

    it('Should return attachments generated', async () => {
      const spyOrderMapperMapAttachment = jest
        .spyOn(OrderMapper, 'mapAttachment')
        .mockImplementation(() => Promise.resolve(attachmentMock));

      expect(
        await (service as any).generateAttachments(
          ordersUpdateMappedMock,
          true,

          ordersEntityMock,
        ),
      ).toStrictEqual([attachmentMock]);

      const oldAttachment = {
        ...attachmentMock,
        originalUrl:
          'https://s3-storage.intelipost.com.br/17359/file_attachment/b681a175-b701-4174-97d4-e9e1a6f38333/comprovante.jpg',
      };
      expect(
        await (service as any).generateAttachments(
          ordersUpdateMappedMock,
          false,

          { ...ordersEntityMock, attachments: [oldAttachment] },
        ),
      ).toStrictEqual([oldAttachment, attachmentMock]);

      expect(
        await (service as any).generateAttachments(
          ordersUpdateMappedMock,
          false,

          ordersEntityMock,
        ),
      ).toStrictEqual([attachmentMock]);

      expect(spyOrderMapperMapAttachment).toBeCalledTimes(2);
    });
  });
});
