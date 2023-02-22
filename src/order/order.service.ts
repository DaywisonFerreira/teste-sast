import { KafkaService } from '@infralabs/infra-nestjs-kafka';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { differenceInDays, isBefore, lightFormat } from 'date-fns';
import { appendFileSync } from 'graceful-fs';
import * as moment from 'moment';
import { LeanDocument, Model, Types } from 'mongoose';
import {
  AccountDocument,
  AccountEntity,
} from 'src/account/schemas/account.schema';
import { Env } from 'src/commons/environment/env';
import { MessageOrderNotified } from 'src/intelipost/factories';
import { stream } from 'exceljs';

import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { utils } from 'xlsx';

import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { LogProvider } from 'src/commons/providers/log/log-provider.interface';
import { OriginEnum } from 'src/commons/enums/origin-enum';
import { CsvMapper } from './mappers/csvMapper';
import { OrderMapper } from './mappers/orderMapper';
import {
  Attachments,
  OrderDocument,
  OrderEntity,
  PublicFieldsOrder,
} from './schemas/order.schema';
import { OrderProducer } from './producer/order.producer';

const originArray: Array<string> = Object.values(OriginEnum);

interface xlsxWriteMetadata {
  filename: string;
  useStyles: boolean;
  useSharedStrings: boolean;
  columns: Array<string>;
  content: Array<any>;
}

async function* getDataAsStream(filter, collection) {
  const PAGE_SIZE = Env.CHUNK_SIZE_WRITE;
  let page = 1;
  let countDocuments = 0;

  while (true) {
    const data = await collection
      .find(filter)
      .limit(PAGE_SIZE)
      .skip((page - 1) * PAGE_SIZE);

    if (data.length === 0) break;

    const adaptedData = CsvMapper.mapOrderToCsv(data);

    for (const item of adaptedData) {
      yield item;
    }
    page += 1;
    countDocuments += adaptedData.length;

    if (countDocuments >= Env.LIMIT_CSV_REPORT_SIZE) {
      yield 'Limite de pedidos atingido. Ainda há pedidos não listados';
      break;
    }
  }
}

@Injectable()
export class OrderService {
  constructor(
    @Inject('KafkaService') private kafkaProducer: KafkaService,
    @InjectModel(AccountEntity.name)
    private accountModel: Model<AccountDocument>,
    @InjectModel(OrderEntity.name)
    private OrderModel: Model<OrderDocument>,
    @Inject('LogProvider')
    private readonly logger: LogProvider,
    private orderProducer: OrderProducer,
  ) {
    this.logger.instanceLogger(OrderService.name);
  }

  async findAll({
    page,
    pageSize,
    orderBy,
    orderDirection,
    search,
    storeId,
    orderCreatedAtFrom,
    orderCreatedAtTo,
    shippingEstimateDateFrom,
    shippingEstimateDateTo,
    statusCode,
    filterPartnerOrdersOrOrderSale,
  }): Promise<[LeanDocument<OrderEntity[]>, number]> {
    const filter: any = {};

    if (filterPartnerOrdersOrOrderSale.length) {
      filter.$or = [
        { partnerOrder: { $in: filterPartnerOrdersOrOrderSale } },
        { orderSale: { $in: filterPartnerOrdersOrOrderSale } },
      ];
    }

    if (storeId) {
      filter.storeId = new Types.ObjectId(storeId);
    }

    if (statusCode) {
      filter['statusCode.micro'] = {
        $in: statusCode.split(','),
      };
    }

    if (search) {
      filter.$or = [
        { order: { $regex: `${search}.*`, $options: 'i' } },
        { orderSale: { $regex: `${search}.*`, $options: 'i' } },
        { partnerOrder: { $regex: `${search}.*`, $options: 'i' } },
        { 'customer.firstName': { $regex: `${search}.*`, $options: 'i' } },
        { 'customer.fullName': { $regex: `${search}.*`, $options: 'i' } },
        {
          'invoice.customerDocument': {
            $regex: `${search}.*`,
            $options: 'i',
          },
        },
        { 'invoice.number': { $regex: `${search}.*`, $options: 'i' } },
        { 'invoice.key': { $regex: `${search}.*`, $options: 'i' } },
        { 'invoice.trackingNumber': { $regex: `${search}.*`, $options: 'i' } },
        {
          'logisticInfo.deliveryCompany': {
            $regex: `${search}.*`,
            $options: 'i',
          },
        },
      ];
    }

    if (shippingEstimateDateFrom && shippingEstimateDateTo) {
      const dateFrom = new Date(`${shippingEstimateDateFrom} 00:00:00-03:00`);
      const dateTo = new Date(`${shippingEstimateDateTo} 23:59:59-03:00`);
      this.validateRangeOfDates(dateFrom, dateTo);
      filter.estimateDeliveryDateDeliveryCompany = {
        $gte: dateFrom,
        $lte: dateTo,
      };
    }

    if (shippingEstimateDateFrom && !shippingEstimateDateTo) {
      filter.estimateDeliveryDateDeliveryCompany = {
        $gte: new Date(`${shippingEstimateDateFrom} 00:00:00-03:00`),
        $lte: new Date(`${shippingEstimateDateFrom} 23:59:59-03:00`),
      };
    }

    if (orderCreatedAtFrom && orderCreatedAtTo) {
      const dateFrom = new Date(`${orderCreatedAtFrom} 00:00:00-03:00`);
      const dateTo = new Date(`${orderCreatedAtTo} 23:59:59-03:00`);
      this.validateRangeOfDates(dateFrom, dateTo);
      filter.orderCreatedAt = {
        $gte: dateFrom,
        $lte: dateTo,
      };
    }

    if (orderCreatedAtFrom && !orderCreatedAtTo) {
      filter.orderCreatedAt = {
        $gte: new Date(`${orderCreatedAtFrom} 00:00:00-03:00`),
        $lte: new Date(`${orderCreatedAtFrom} 23:59:59-03:00`),
      };
    }

    const sortBy = { [orderBy]: orderDirection === 'asc' ? 1 : -1 };
    const count = await this.OrderModel.countDocuments(filter);
    const result = await this.OrderModel.find(filter, PublicFieldsOrder)
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort(sortBy)
      .lean();

    return [result, count];
  }

  async findOne(orderId: string): Promise<LeanDocument<OrderEntity>> {
    const list = Types.ObjectId.isValid(orderId)
      ? [new Types.ObjectId(orderId), orderId]
      : [orderId];

    const order = await this.OrderModel.findOne({
      orderId: { $in: list },
    }).lean();

    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    return order;
  }

  async updateOrderStatus(
    data: any,
    headers: { [key: string]: any },
    origin: string,
  ) {
    const configPK = {
      'invoice.key': data?.tracking?.sequentialCode,
    };

    const dataToMerge: any = {
      statusCode: data?.tracking?.statusCode ?? {},
      partnerStatusId: data?.tracking?.provider?.status,
      partnerMessage: data?.tracking?.provider?.status,
      numberVolumes: 1,
      i18n: data?.tracking?.statusCode.macro,
      microStatus: data?.tracking?.provider?.status,
      lastOccurrenceMacro: data?.tracking?.statusCode?.macro,
      lastOccurrenceMicro: data?.tracking?.statusCode?.micro,
      lastOccurrenceMessage: data?.tracking?.provider?.status,
      partnerStatus:
        data?.tracking?.provider?.status.toLowerCase() === 'dispatched'
          ? 'shipped'
          : data?.tracking?.provider?.status.toLowerCase(),
      orderUpdatedAt: new Date(data?.tracking?.eventDate),
      invoiceKeys: [data?.tracking?.sequentialCode],
      invoice: {
        key: data?.tracking?.sequentialCode,
        // trackingNumber: data?.tracking?.provider?.trackingCode,
      },
    };

    if (origin === OriginEnum.DELIVERY_HUB) {
      dataToMerge.reason = data?.tracking?.reason;
      dataToMerge.additionalInfo = data?.tracking?.additionalInfo;
      dataToMerge.author = data?.tracking?.author;
    }

    if (
      data?.tracking?.provider?.trackingCode !== undefined &&
      data?.tracking?.provider?.trackingCode !== null
    ) {
      dataToMerge.invoice.trackingNumber =
        data?.tracking?.provider?.trackingCode;
    }

    if (
      data?.tracking?.provider?.trackingUrl !== undefined &&
      data?.tracking?.provider?.trackingUrl !== null
    ) {
      dataToMerge.invoice.trackingUrl = data?.tracking?.provider?.trackingUrl;
    }
    if (
      data?.tracking?.provider?.carrierName !== undefined &&
      data?.tracking?.provider?.carrierName !== null
    ) {
      dataToMerge.invoice.carrierName = data?.tracking?.provider?.carrierName;
    }

    if (dataToMerge.statusCode.macro === 'delivered') {
      dataToMerge.status = dataToMerge.statusCode.macro;
      dataToMerge.deliveryDate = dataToMerge.orderUpdatedAt;
    }

    if (dataToMerge.statusCode.macro === 'order-dispatched') {
      dataToMerge.status = 'dispatched';
      dataToMerge.dispatchDate = dataToMerge.orderUpdatedAt;
    }

    const { success, order } = await this.merge(
      headers,
      configPK,
      dataToMerge,
      origin,
    );

    if (success) {
      await this.orderProducer.sendStatusTrackingToIHub(order);
    }

    return {
      success,
      order,
    };
  }

  async updateOrderInvoiceData(
    key: string,
    orderSale: string,
    trackingUrl: string,
    carrierName: string,
    trackingNumber: string,
  ): Promise<LeanDocument<OrderEntity>> {
    return this.OrderModel.updateOne(
      {
        orderSale,
        'invoice.key': key,
      },
      {
        $set: {
          'invoice.trackingUrl': trackingUrl,
          'invoice.carrierName': carrierName,
          'invoice.trackingNumber': trackingNumber,
        },
      },
    ).lean();
  }

  async findByKeyAndOrderSale(
    key: string,
    orderSale: string,
  ): Promise<LeanDocument<OrderEntity>> {
    return this.OrderModel.findOne({
      orderSale,
      'invoice.key': key,
    }).lean();
  }

  async createReportConsolidated({
    orderCreatedAtFrom,
    orderCreatedAtTo,
    tenants,
  }) {
    const filter = {
      storeId: { $in: tenants.map(tenant => new Types.ObjectId(tenant)) },
      orderCreatedAt: {
        $gte: new Date(`${orderCreatedAtFrom} 00:00:00-03:00`),
        $lte: new Date(`${orderCreatedAtTo} 23:59:59-03:00`),
      },
    };

    const directory_path =
      process.env.NODE_ENV !== 'local'
        ? `${process.cwd()}/dist/tmp`
        : `${process.cwd()}/src/tmp`;

    if (!existsSync(directory_path)) {
      mkdirSync(directory_path);
    }

    const fileName = `relatorio_consolidadoDH_${lightFormat(
      new Date(`${orderCreatedAtFrom}T00:00:00`),
      'ddMMyyyy',
    )}-${lightFormat(
      new Date(`${orderCreatedAtTo}T23:59:59`),
      'ddMMyyyy',
    )}.csv`;

    const stream = Readable.from(getDataAsStream(filter, this.OrderModel));
    await pipeline(
      stream,
      // eslint-disable-next-line func-names
      async function* (source) {
        for await (const order of source) {
          yield JSON.stringify(order).concat('\n');
        }
      },
      createWriteStream(`${directory_path}/${fileName}`, {
        flags: 'a',
        encoding: null,
      }),
    );
    return {
      path: `${directory_path}/${fileName}`,
      fileName,
    };
  }

  async exportData(
    { orderCreatedAtFrom, orderCreatedAtTo, type, storeId },
    userId,
  ) {
    const conditions: any = {
      storeId: new Types.ObjectId(storeId),
    };

    if (orderCreatedAtFrom && orderCreatedAtTo) {
      const dateFrom = new Date(`${orderCreatedAtFrom} 00:00:00-03:00`);
      const dateTo = new Date(`${orderCreatedAtTo} 23:59:59-03:00`);
      this.validateRangeOfDates(dateFrom, dateTo);
      conditions.orderCreatedAt = {
        $gte: dateFrom,
        $lte: dateTo,
      };
    }

    const chunkSize = Env.CHUNK_SIZE_WRITE;
    const countOrders = await this.OrderModel.countDocuments(conditions);
    this.logger.log(
      {
        key: 'ifc.freight.api.order.order-service.exportData.create',
        message: `Creating an order report, with ${countOrders} documents`,
      },
      {},
    );

    let file = {
      path: '',
      fileName: '',
      worksheet: '',
      workbook: '',
    };

    const pages = Math.ceil(countOrders / chunkSize); // 2000

    let workBook;
    let totalRowCount = 0;
    let sheetPosition = 1;
    // eslint-disable-next-line no-plusplus
    for (let page = 0; page < pages; page++) {
      // eslint-disable-next-line no-await-in-loop
      const result = await this.OrderModel.find(conditions, {
        receiverName: 1,
        receiverEmail: 1,
        deliveryCity: 1,
        deliveryState: 1,
        deliveryZipCode: 1,
        orderUpdatedAt: 1,
        deliveryDate: 1,
        orderCreatedAt: 1,
        paymentDate: 1,
        dispatchDate: 1,
        estimateDeliveryDateDeliveryCompany: 1,
        estimateDeliveryDate: 1,
        status: 1,
        partnerStatus: 1,
        orderSale: 1,
        order: 1,
        invoice: 1,
        receiverPhones: 1,
        logisticInfo: 1,
        billingData: 1,
        partnerMessage: 1,
        numberVolumes: 1,
        originZipCode: 1,
        statusCode: 1,
        square: 1,
        physicalWeight: 1,
        lastOccurrenceMacro: 1,
        lastOccurrenceMicro: 1,
        lastOccurrenceMessage: 1,
        quantityOccurrences: 1,
        history: 1,
        totals: 1,
        storeCode: 1,
      })
        .limit(chunkSize)
        .skip(chunkSize * page)
        .lean();

      this.logger.log(
        {
          key: 'ifc.freight.api.order.order-service.exportData.progress',
          message: `Order report in progress: ${page + 1}/${pages}, with ${
            result.length
          } records`,
        },
        {},
      );

      const dataFormatted = CsvMapper.mapOrderToCsv(result);

      if (type === 'csv') {
        file = this.createCsvLocally(
          dataFormatted,
          {
            orderCreatedAtFrom,
            orderCreatedAtTo,
            userId,
            storeCode: result[0]?.storeCode,
          },
          file.fileName,
        );
      }

      if (type === 'xlsx') {
        const from = lightFormat(
          new Date(`${orderCreatedAtFrom}T00:00:00`),
          'ddMMyyyy',
        );
        const to = lightFormat(
          new Date(`${orderCreatedAtTo}T23:59:59`),
          'ddMMyyyy',
        );

        const storeCode = result[0]?.storeCode;

        const folder = Env.NODE_ENV !== 'local' ? 'dist' : 'src';
        const path = `${process.cwd()}/${folder}/tmp`;

        const fileName = `Status_Entregas_${
          storeCode || ''
        }_${from}-${to}.xlsx`;

        const columns = Object.keys(dataFormatted[0]) || [];

        const { filename, workBookWriter, rowCount, sheetIndex } =
          await this.createXlsxLocally(
            {
              filename: `${path}/${fileName}`,
              useStyles: true,
              useSharedStrings: true,
              columns,
              content: dataFormatted,
            },
            {
              firstPage: page === 0,
              lastPage: page === pages - 1,
              sheetIndex: sheetPosition,
            },
            totalRowCount,
            workBook,
          );

        workBook = workBookWriter;
        sheetPosition = sheetIndex;
        totalRowCount = rowCount;

        file.fileName = fileName;
        file.path = filename;
      }
    }
    return file;
  }

  private getStatusScale(status: string) {
    switch (status) {
      case 'order-created':
        return 0;
      case 'order-dispatched':
        return 2;
      case 'in-transit':
        return 3;
      case 'out-of-delivery':
        return 4;
      case 'check-delivery-failed':
        return 5;
      case 'delivered':
        return 6;
      case 'delivery-failed':
        return 6;
      case 'canceled':
        return 6;
      default:
        return 1;
    }
  }

  private async generateAttachments(
    data,
    isCreate,
    oldOrder?: any,
  ): Promise<Attachments[]> {
    const { invoice } = data;

    // Update flow
    if (isCreate === false) {
      const originalUrls =
        oldOrder?.attachments?.map(({ originalUrl }) => originalUrl) || [];

      let attachments = data.attachments.filter(({ url }) => {
        if (originalUrls.includes(url)) {
          this.logger.log(
            {
              key: 'ifc.freight.api.order.order-service.generateAttachments',
              message: `generateAttachment - OrderSale: ${data.orderSale} order: ${data.partnerOrder} received a duplicate file (${url}) by Intelipost and will be ignore`,
            },
            {},
          );
          return false;
        }
        return true;
      });

      attachments = (
        await Promise.all(
          attachments.map(attachment =>
            OrderMapper.mapAttachment(attachment, invoice.key),
          ),
        )
      ).filter(o => Object.keys(o).length);

      return [
        ...(oldOrder?.attachments || []),
        ...attachments,
      ] as Attachments[];
    }

    return (
      await Promise.all(
        data.attachments.map(attachment =>
          OrderMapper.mapAttachment(attachment, invoice.key),
        ),
      )
    ).filter(o => Object.keys(o).length) as Attachments[];
  }

  private generateHistory(data, origin, isCreate, oldOrder?: any) {
    const sortHistory = (HistoryOne, HistoryTwo) => {
      if (
        this.getStatusScale(HistoryOne?.statusCode?.macro) >
        this.getStatusScale(HistoryTwo?.statusCode?.macro)
      ) {
        return 1;
      }
      if (
        this.getStatusScale(HistoryOne?.statusCode?.macro) <
        this.getStatusScale(HistoryTwo?.statusCode?.macro)
      ) {
        return -1;
      }
      return 0;
    };

    let historyExists = false;
    if (oldOrder && Array.isArray(oldOrder.history)) {
      historyExists = !!oldOrder.history.find(history => {
        return (
          history.partnerStatusId === data.partnerStatusId &&
          history.orderUpdatedAt.getTime() === data.orderUpdatedAt.getTime()
        );
      });
    }

    if (historyExists) {
      this.logger.log(
        {
          key: 'ifc.freight.api.order.order-service.generateHistory',
          message: `generateHistory - OrderSale: ${oldOrder.orderSale} order: ${oldOrder.partnerOrder} received a duplicate status (statusMicro: ${data.statusCode.micro}, statusMacro: ${data.statusCode.macro}) by Intelipost and will be ignore`,
        },
        {},
      );
      return { ignore: true, history: [] };
    }

    if (originArray.includes(origin)) {
      const history = this.getHistoryFromOrigin(origin, data);

      if (isCreate) {
        return { ignore: false, history: [history] };
      }
      if (!historyExists) {
        const historyToSort = [...(oldOrder?.history || []), history];
        return { ignore: false, history: historyToSort.sort(sortHistory) };
      }
    }
    return { ignore: true, history: [] };
  }

  private getHistoryFromOrigin(origin: string, data: any) {
    let history: any;
    if (origin === OriginEnum.INTELIPOST) {
      history = OrderMapper.mapPartnerHistoryToOrderHistory(data);
    } else if (origin === OriginEnum.FREIGHT_CONNECTOR) {
      history = OrderMapper.mapFreightConnectorHistoryToOrderHistory(data);
    } else if (origin === OriginEnum.DELIVERY_HUB) {
      history = OrderMapper.mapDeliveryHubHistoryToOrderHistory(data);
    }
    return history;
  }

  public async createOrder(data, origin) {
    const orderFinded = await this.OrderModel.find({
      orderSale: data.orderSale,
    });

    if (!orderFinded.length) {
      const { history } = this.generateHistory(data, origin, true);
      const attachments =
        origin === OriginEnum.INTELIPOST
          ? await this.generateAttachments(data, true)
          : [];

      const order = await this.OrderModel.create({
        ...data,
        history,
        attachments,
      });
      return { success: true, order };
    }

    for (const order of orderFinded) {
      await this.OrderModel.findOneAndUpdate(
        {
          orderSale: order.orderSale,
          'invoice.key': order.invoice.key,
        },
        {
          $push: {
            invoiceKeys: data.invoice.key,
          },
        },
        {
          new: true,
          runValidators: true,
          useFindAndModify: false,
        },
      );
    }

    data.invoiceKeys.push(...orderFinded[0].invoiceKeys);

    const { history } = this.generateHistory(data, origin, true);
    const attachments =
      origin === OriginEnum.INTELIPOST
        ? await this.generateAttachments(data, true)
        : [];

    const order = await this.OrderModel.create({
      ...data,
      history,
      attachments,
    });
    return { success: true, order };
  }

  private async updateOrdersWithMultipleInvoices(
    configPK,
    data,
    oldOrders,
    origin,
    options,
  ) {
    const oldOrder = oldOrders.find(
      ({ invoice }) => invoice.key === data.invoice.key,
    );
    if (!oldOrder || !Object.keys(oldOrder).length) {
      this.logger.log(
        {
          key: 'ifc.freight.api.order.order-service.updateOrdersWithMultipleInvoices.not-exists',
          message: `updateOrdersWithMultipleInvoices - OldOrder not exists. OrderSale: ${data.orderSale} order: ${data.partnerOrder}`,
        },
        {},
      );
      return { success: false, order: data };
    }

    const OrderAlreadyFinished = this.checkIfOrderAlreadyFinished(
      oldOrder.statusCode.micro,
    );

    if (OrderAlreadyFinished) {
      this.logger.log(
        {
          key: 'ifc.freight.api.order.order-service.updateOrdersWithMultipleInvoices.ignored',
          message: `updateOrdersWithMultipleInvoices - OrderSale: ${oldOrder.orderSale} order: ${oldOrder.partnerOrder} already finished with status: ${oldOrder.statusCode.macro}, request update with status: ${data.statusCode.macro} will be ignored`,
        },
        {},
      );

      return { success: false, order: oldOrder };
    }

    const { ignore, history } = this.generateHistory(
      data,
      origin,
      false,
      oldOrder,
    );

    const attachments =
      origin === OriginEnum.INTELIPOST
        ? await this.generateAttachments(data, false, oldOrder)
        : [];

    const shouldUpdateSourceOfOrder = this.shouldUpdateSourceOfOrder(
      data.statusCode.macro,
      oldOrder.statusCode.macro,
    );

    const newContent = {
      ...(shouldUpdateSourceOfOrder
        ? {
            statusCode: data.statusCode,
            orderUpdatedAt: data.orderUpdatedAt,
            partnerMessage: data.partnerMessage,
            partnerStatusId: data.partnerStatusId,
            partnerMacroStatusId: data.partnerMacroStatusId,
            microStatus: data.microStatus,
            lastOccurrenceMacro: data.lastOccurrenceMacro,
            lastOccurrenceMicro: data.lastOccurrenceMicro,
            lastOccurrenceMessage: data.lastOccurrenceMessage,
            i18n: data.i18n,
            partnerStatus: data.partnerStatus,
            status: data.status,
            deliveryDate: data.deliveryDate,
            dispatchDate: data.dispatchDate,
          }
        : {}),
      invoiceKeys: [...new Set([...data.invoiceKeys, ...oldOrder.invoiceKeys])],
      invoice: {
        ...data.invoice,
        ...oldOrder.invoice,
      },
      ...(ignore ? {} : { history }),
      attachments,
    };

    await this.OrderModel.updateMany(configPK, newContent, options);

    const order = await this.OrderModel.find({
      orderSale: data.orderSale,
      'invoice.key': data.invoice.key,
    });

    return { success: true, order: order[0] };
  }

  private async updateOrder(configPK, data, oldOrder, origin, options) {
    const OrderAlreadyFinished = this.checkIfOrderAlreadyFinished(
      oldOrder.statusCode.micro,
    );

    if (OrderAlreadyFinished) {
      this.logger.log(
        {
          key: 'ifc.freight.api.order.order-service.updateOrder',
          message: `updateOrder - OrderSale: ${oldOrder.orderSale} order: ${oldOrder.partnerOrder} already finished with status: ${oldOrder.statusCode.micro}, request update with status: ${data.statusCode.micro} will be ignored`,
        },
        {},
      );

      return { success: false, order: oldOrder };
    }

    let shouldUpdateSourceOfOrder = this.shouldUpdateSourceOfOrder(
      data.statusCode.macro,
      oldOrder.statusCode.macro,
    );

    const { ignore, history } = this.generateHistory(
      data,
      origin,
      false,
      oldOrder,
    );

    const attachments =
      origin === OriginEnum.INTELIPOST
        ? await this.generateAttachments(data, false, oldOrder)
        : [];

    const newDataToSave = { ...data };

    if (!shouldUpdateSourceOfOrder && origin === OriginEnum.IHUB) {
      shouldUpdateSourceOfOrder = true;
      newDataToSave.statusCode = oldOrder.statusCode;
      newDataToSave.orderUpdatedAt = oldOrder.orderUpdatedAt;
      if (oldOrder.status) newDataToSave.status = oldOrder.status;
      if (oldOrder.partnerStatus)
        newDataToSave.partnerStatus = oldOrder.partnerStatus;
      if (oldOrder.dispatchDate)
        newDataToSave.dispatchDate = oldOrder.dispatchDate;
      if (oldOrder.deliveryDate)
        newDataToSave.deliveryDate = oldOrder.deliveryDate;
    }

    // repensar em como ignorar um historico novo, porém tbm não enviar para o IHUB
    const newContent = {
      ...(shouldUpdateSourceOfOrder ? newDataToSave : {}),
      invoice: {
        ...newDataToSave.invoice,
        ...oldOrder.invoice,
      },
      invoiceKeys: [
        ...new Set([...newDataToSave.invoiceKeys, ...oldOrder.invoiceKeys]),
      ],
      ...(ignore ? {} : { history }),
      attachments,
      // Task code: C30F-1788
      ...(newDataToSave.status && !oldOrder.status
        ? { status: newDataToSave.status }
        : {}),
      ...(newDataToSave.dispatchDate && !oldOrder.dispatchDate
        ? { dispatchDate: newDataToSave.dispatchDate }
        : {}),
    };
    const order = await this.OrderModel.findOneAndUpdate(
      configPK,
      newContent,
      options,
    );

    return { success: true, order };
  }

  async merge(headers: any, configPK: any, data: any = {}, origin: string) {
    const options: any = {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    };
    let operationStatus: { success: boolean; order: any };
    const orders = await this.OrderModel.find(configPK).lean();

    if (!orders.length) {
      operationStatus = await this.createOrder(data, origin);
    } else if (orders.length > 1) {
      operationStatus = await this.updateOrdersWithMultipleInvoices(
        configPK,
        data,
        orders,
        origin,
        options,
      );
    } else {
      operationStatus = await this.updateOrder(
        configPK,
        data,
        orders[0],
        origin,
        options,
      );
    }

    if (operationStatus.success && operationStatus.order.storeId) {
      let account: Partial<AccountEntity> = await this.accountModel
        .findOne({ id: operationStatus.order.storeId })
        .lean();

      if (!account) {
        account = { id: operationStatus.order.storeId };
      }

      await this.kafkaProducer.send(
        Env.KAFKA_TOPIC_ORDER_NOTIFIED,
        MessageOrderNotified({
          order: operationStatus.order,
          account,
          headers,
        }),
      );
    }

    return operationStatus;
  }

  private validateRangeOfDates(dateFrom: Date, dateTo: Date) {
    if (differenceInDays(dateTo, dateFrom) > 62) {
      throw new Error('Date difference greater than 2 months');
    }

    if (isBefore(dateTo, dateFrom)) {
      throw new Error('Invalid range of dates');
    }
  }

  async getOrderDetails(orderId: string, tenants: string[]): Promise<any> {
    const order = await this.findOne(orderId);
    this.validateStore(tenants, String(order.storeId));

    const {
      totals = [],
      value,
      orderSale,
      order: orderERP,
      orderCreatedAt,
      estimateDeliveryDateDeliveryCompany,
      logisticInfo,
      invoice,
      history = [],
      internalOrderId,
      statusCode,
      attachments,
    } = order;

    /**
     * History array order by ASC
     */
    let historyOrderByASC = [];
    if (history.length > 0) {
      historyOrderByASC = history.sort((a, b) => {
        return moment(a.orderUpdatedAt).diff(b.orderUpdatedAt);
      });
    }

    // TODO: TERMINAR!!!
    const sequenceStatus = [
      'order-created',
      'order-dispatched',
      'in-transit',
      'out-of-delivery',
    ];
    const finishersStatus = ['delivered', 'delivery-failed', 'canceled'];

    /**
     * Steppers
     */
    let steppers = history
      .map(hist => (hist?.statusCode?.macro ? hist.statusCode.macro : ''))
      .filter(x => x !== '');

    steppers.sort((a, b) => {
      if (sequenceStatus.indexOf(a) < sequenceStatus.indexOf(b)) {
        return 0;
      }
      if (sequenceStatus.indexOf(a) > sequenceStatus.indexOf(b)) {
        return 1;
      }
      return 0;
    });

    if (steppers.length < 5) {
      if (
        finishersStatus.reduce(
          (acc, status) => acc || steppers.includes(status),
          false,
        )
      ) {
        steppers = sequenceStatus.reduce((result, status) => {
          const onceFinisherStatusAlreadyExists = finishersStatus.reduce(
            (acc, status) => acc || result.includes(status),
            false,
          );
          if (
            steppers.includes(status) ||
            (finishersStatus.includes(status) &&
              !onceFinisherStatusAlreadyExists)
          ) {
            return [...result, status];
          }
          if (onceFinisherStatusAlreadyExists) return result;
          return [...result, status];
        }, []);
      }
    }

    /**
     * Total values
     */
    let values = {};
    if (totals.length > 0) {
      values = {
        totalValueItems: totals.find(total => total.id === 'Items').value,
        totalDiscounts: totals.find(total => total.id === 'Discounts').value,
        totalShipping: totals.find(total => total.id === 'Shipping').value,
        value,
      };
    }

    /**
     * deliveryCompany + logisticContract
     */
    const shippingMethod = `${logisticInfo[0].deliveryCompany} ${logisticInfo[0].logisticContract}`;

    /**
     * If the order status is equal to invoiced, it will be returned to the
     * logisticInfo carrier, if the status is dispatched or delivered, it
     * will be returned to the carrier that is on the note.
     */
    const shippingCompany =
      order.status === 'invoiced'
        ? logisticInfo[0].deliveryCompany
        : invoice.carrierName;

    const data = {
      values,
      shippingMethod,
      shippingCompany,
      platformCode: orderSale,
      codeERP: orderERP,
      purchaseDate: orderCreatedAt,
      estimateDeliveryDate: estimateDeliveryDateDeliveryCompany,
      erpId: internalOrderId,
      statusCode,
      steppers,
      historyOrderByASC,
      attachments,
    };

    return data;
  }

  private createCsvLocally(data: unknown[], filter: any, file?: string) {
    let csv: string;
    let workbook: any;
    let worksheet: any;

    const directory_path =
      process.env.NODE_ENV !== 'local'
        ? `${process.cwd()}/dist/tmp`
        : `${process.cwd()}/src/tmp`;

    if (!existsSync(directory_path)) {
      mkdirSync(directory_path);
    }

    if (data) {
      const skipHeader = !!file;
      const worksheet = utils.json_to_sheet(data, { skipHeader });
      csv = utils.sheet_to_csv(worksheet);
    }

    const from = lightFormat(
      new Date(`${filter.orderCreatedAtFrom}T00:00:00`),
      'ddMMyyyy',
    );
    const to = lightFormat(
      new Date(`${filter.orderCreatedAtTo}T23:59:59`),
      'ddMMyyyy',
    );

    const fileName =
      file || `Status_Entregas_${filter.storeCode || ''}_${from}-${to}.csv`;

    appendFileSync(`${directory_path}/${fileName}`, csv || '', {
      flag: 'a+',
    });

    return {
      path: `${directory_path}/${fileName}`,
      fileName,
      workbook,
      worksheet,
    };
  }

  private async createXlsxLocally(
    metadata: xlsxWriteMetadata = {
      filename: '',
      useStyles: true,
      useSharedStrings: true,
      columns: [],
      content: [],
    },
    paginationInfo: {
      firstPage: boolean;
      lastPage: boolean;
      sheetIndex: number;
    },
    rowCount: number,
    workBook?: stream.xlsx.WorkbookWriter,
  ) {
    let count = rowCount;

    let sheetPosition = paginationInfo.sheetIndex;

    const workbookWriter = paginationInfo.firstPage
      ? new stream.xlsx.WorkbookWriter(metadata)
      : workBook;

    const columns = [];

    if (paginationInfo.firstPage) {
      metadata.columns.forEach(column => {
        columns.push({
          header: column,
          key: column,
          width: 15,
        });
      });
      workbookWriter.addWorksheet(`Sheet ${sheetPosition}`).columns = columns;
    }

    if (count === Env.LIMIT_LINES_XLSX_FILE) {
      count = 0;
      sheetPosition += 1;
      metadata.columns.forEach(column => {
        columns.push({
          header: column,
          key: column,
          width: 15,
        });
      });
      workbookWriter.addWorksheet(`Sheet ${sheetPosition}`).columns = columns;
    }

    for (const content of metadata.content) {
      const row = Object.keys(content).reduce((acc, next) => {
        return {
          ...acc,
          [next]: content[next],
        };
      }, {});
      // eslint-disable-next-line no-plusplus
      workbookWriter
        .getWorksheet(`Sheet ${sheetPosition}`)
        .addRow(row)
        .commit();
    }

    count += metadata.content.length;

    if (paginationInfo.lastPage) {
      workbookWriter.getWorksheet(`Sheet ${sheetPosition}`).commit();
      await workbookWriter.commit();
    }

    return {
      filename: metadata.filename,
      workBookWriter: workbookWriter,
      rowCount: count,
      sheetIndex: sheetPosition,
    };
  }

  private validateStore(tenants: string[], storeId: string) {
    if (!tenants.includes(storeId)) {
      throw new HttpException(
        'Order does not belong to this store.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private shouldUpdateSourceOfOrder(
    intelipostStatusCodeMacro: string,
    oldOrderStatusCodeMacro: string,
  ): boolean {
    return (
      this.getStatusScale(intelipostStatusCodeMacro) >=
      this.getStatusScale(oldOrderStatusCodeMacro)
    );
  }

  private checkIfOrderAlreadyFinished(microStatus: string): boolean {
    return Env.LIST_MICRO_STATUS_FINISHER.includes(microStatus);
  }

  public async updateIntegrations(
    filter: Record<string, any>,
    invoice: any,
    newIntegration: {
      name: string;
      status: string;
      errorMessage: string;
      createdAt: Date;
    },
  ): Promise<void> {
    const order = await this.OrderModel.findOne(filter, PublicFieldsOrder, {
      lean: true,
    });

    if (order?.integrations && order?.integrations.length) {
      const index = order.integrations.findIndex(
        integration => integration.name === newIntegration.name,
      );
      if (index >= 0) {
        order.integrations.splice(index, 1, newIntegration);

        await this.OrderModel.updateOne(filter, {
          $set: {
            integrations: order.integrations,
          },
        });
      } else {
        await this.OrderModel.updateOne(filter, {
          $push: { integrations: newIntegration },
        });
      }
    } else if (!order) {
      await this.OrderModel.updateOne(
        filter,
        {
          $set: {
            invoiceKeys: [invoice.key],
            invoice: { key: invoice.key },
            statusCode: { micro: 'invoiced', macro: 'order-created' },
            orderSale: invoice.order.externalOrderId,
            partnerOrder: invoice.order.internalOrderId,
            integrations: [newIntegration],
          },
        },
        {
          upsert: true,
        },
      );
    } else {
      await this.OrderModel.updateOne(filter, {
        $set: {
          integrations: [newIntegration],
        },
      });
    }
  }
}
