import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { appendFileSync } from 'graceful-fs';
import { InjectModel } from '@nestjs/mongoose';
import { differenceInDays, isBefore, lightFormat } from 'date-fns';
import { LeanDocument, Model, Types } from 'mongoose';
import * as moment from 'moment';
import { KafkaService } from '@infralabs/infra-nestjs-kafka';
import {
  AccountDocument,
  AccountEntity,
} from 'src/account/schemas/account.schema';
import { Env } from 'src/commons/environment/env';
import { MessageOrderNotified } from 'src/intelipost/factories';

import { existsSync, mkdirSync } from 'fs';
import { utils } from 'xlsx';

import { CsvMapper } from './mappers/csvMapper';
import { chunkArray } from '../commons/utils/array.utils';
import {
  OrderDocument,
  OrderEntity,
  PublicFieldsOrder,
} from './schemas/order.schema';
import { OrderMapper } from './mappers/orderMapper';

@Injectable()
export class OrderService {
  constructor(
    @Inject('KafkaService') private kafkaProducer: KafkaService,
    @InjectModel(AccountEntity.name)
    private accountModel: Model<AccountDocument>,
    @InjectModel(OrderEntity.name)
    private OrderModel: Model<OrderDocument>,
  ) {}

  async findAll({
    page,
    pageSize,
    orderBy,
    orderDirection,
    search,
    storeId,
    orderCreatedAtFrom,
    orderCreatedAtTo,
    orderUpdatedAtFrom,
    orderUpdatedAtTo,
    statusCode,
  }): Promise<[LeanDocument<OrderEntity[]>, number]> {
    const filter: any = {};

    if (storeId) {
      filter.storeId = new Types.ObjectId(storeId);
    }

    if (statusCode) {
      filter.statusCode.micro = {
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
          'billingData.customerDocument': {
            $regex: `${search}.*`,
            $options: 'i',
          },
        },
        {
          'logisticInfo.deliveryCompany': {
            $regex: `${search}.*`,
            $options: 'i',
          },
        },
      ];
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

    if (orderUpdatedAtFrom && orderUpdatedAtTo) {
      const dateFrom = new Date(`${orderUpdatedAtFrom} 00:00:00-03:00`);
      const dateTo = new Date(`${orderUpdatedAtTo} 23:59:59-03:00`);
      this.validateRangeOfDates(dateFrom, dateTo);
      filter.orderUpdatedAt = {
        $gte: dateFrom,
        $lte: dateTo,
      };
    }

    if (orderUpdatedAtFrom && !orderUpdatedAtTo) {
      filter.orderUpdatedAt = {
        $gte: new Date(`${orderUpdatedAtFrom} 00:00:00-03:00`),
        $lte: new Date(`${orderUpdatedAtFrom} 23:59:59-03:00`),
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
    const order = await this.OrderModel.findOne({
      orderId: { $in: [orderId, new Types.ObjectId(orderId)] },
    }).lean();

    if (!order) {
      throw new HttpException('Order not found.', HttpStatus.NOT_FOUND);
    }

    return order;
  }

  async exportData(
    { orderCreatedAtFrom, orderCreatedAtTo, storeId },
    userId,
    logger: any,
  ) {
    const conditions: any = {
      storeId: new Types.ObjectId(storeId),
    };

    if (orderCreatedAtFrom && orderCreatedAtTo) {
      const dateFrom = new Date(`${orderCreatedAtFrom} 00:00:00-03:00Z`);
      const dateTo = new Date(`${orderCreatedAtTo} 23:59:59-03:00Z`);
      this.validateRangeOfDates(dateFrom, dateTo);
      conditions.orderCreatedAt = {
        $gte: dateFrom,
        $lte: dateTo,
      };
    }

    const chunkSize = Env.CHUNK_SIZE_WRITE;
    const countOrders = await this.OrderModel.countDocuments(conditions);

    logger.log(`Creating an order report, with ${countOrders} documents`);

    let file = {
      path: '',
      fileName: '',
    };

    const pages = Math.ceil(countOrders / chunkSize);

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
        status: 1,
        partnerStatus: 1,
        orderSale: 1,
        order: 1,
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
      })
        .limit(chunkSize)
        .skip(chunkSize * page)
        .lean();

      logger.log(
        `Order report in progress: ${page + 1}/${pages}, with ${
          result.length
        } records`,
      );

      const paginatedResult = chunkArray(result, chunkSize / 10);

      // eslint-disable-next-line no-await-in-loop
      for await (const result of paginatedResult) {
        const dataFormatted = CsvMapper.mapOrderToCsv(result);

        file = this.createCsvLocally(
          dataFormatted,
          {
            orderCreatedAtFrom,
            orderCreatedAtTo,
            userId,
            storeId,
          },
          file.fileName,
        );
      }
    }
    return file;
  }

  private generateHistory(data, origin, isCreate, oldOrder = { history: [] }) {
    let historyExists = false;
    if (oldOrder && Array.isArray(oldOrder.history)) {
      historyExists = !!oldOrder.history.find(
        ({ statusCode }) => statusCode?.micro === data.statusCode.micro,
      );
    }

    if (origin === 'intelipost') {
      const history = OrderMapper.mapPartnerHistoryToOrderHistory(data);

      if (isCreate) {
        return { history: [history] };
      }
      if (!historyExists) {
        return { $push: { history } };
      }
    }
    return {};
  }

  private async createOrder(data, origin) {
    const orderFinded = await this.OrderModel.find({
      orderSale: data.orderSale,
    });

    if (orderFinded.length === 0) {
      return this.OrderModel.create({
        ...data,
        ...this.generateHistory(data, origin, true),
      });
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
      );
    }

    data.invoiceKeys.push(...orderFinded[0].invoiceKeys);

    return this.OrderModel.create({
      ...data,
      ...this.generateHistory(data, origin, true),
    });
  }

  private async updateOrdersWithMultipleInvoices(
    configPK,
    data,
    oldOrder,
    origin,
    options,
  ) {
    const { invoice, invoiceKeys, ...dataToSave } = data;

    await this.OrderModel.updateMany(
      configPK,
      {
        ...dataToSave,
        ...this.generateHistory(
          { ...dataToSave, invoice, invoiceKeys },
          origin,
          false,
          oldOrder,
        ),
      },
      options,
    );

    const order = await this.OrderModel.find({
      orderSale: data.orderSale,
      'invoice.key': invoice.key,
    });

    return order[0];
  }

  private async updateOrder(configPK, data, oldOrder, origin, options) {
    return this.OrderModel.findOneAndUpdate(
      configPK,
      {
        ...data,
        invoice: {
          ...data.invoice,
          ...oldOrder.invoice,
        },
        invoiceKeys: [
          ...new Set([...data.invoiceKeys, ...oldOrder.invoiceKeys]),
        ],
        ...this.generateHistory(data, origin, false, oldOrder),
      },
      options,
    );
  }

  async merge(
    headers: any,
    configPK: any,
    data: any = {},
    origin: string,
    options: any = { new: true, runValidators: true, useFindAndModify: false },
  ) {
    let orderToNotified: any;
    const orders = await this.OrderModel.find(configPK);
    if (!orders.length) {
      orderToNotified = await this.createOrder(data, origin);
    } else if (orders.length > 1) {
      orderToNotified = await this.updateOrdersWithMultipleInvoices(
        configPK,
        data,
        orders[0],
        origin,
        options,
      );
    } else {
      orderToNotified = await this.updateOrder(
        configPK,
        data,
        orders[0],
        origin,
        options,
      );
    }

    if (orderToNotified.storeId) {
      const account = await this.accountModel
        .findOne({ id: orderToNotified.storeId })
        .lean();

      if (!account) {
        throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      }

      const orderToAnalysisNotified: Array<any> =
        OrderMapper.mapMessageToOrderAnalysis(orderToNotified, account);

      await this.kafkaProducer.send(
        Env.KAFKA_TOPIC_ORDER_NOTIFIED,
        MessageOrderNotified({
          orderToAnalysisNotified,
          headers,
        }),
      );
    }

    return orderToNotified;
  }

  private validateRangeOfDates(dateFrom: Date, dateTo: Date) {
    if (differenceInDays(dateTo, dateFrom) > 62) {
      throw new Error('Date difference greater than 2 months');
    }

    if (isBefore(dateTo, dateFrom)) {
      throw new Error('Invalid range of dates');
    }
  }

  async getOrderDetails(orderId: string): Promise<any> {
    const order = await this.findOne(orderId);
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

    /**
     * Steppers
     */
    const steppers = historyOrderByASC
      .map(hist => (hist?.statusCode?.macro ? hist.statusCode.macro : ''))
      .filter(x => x !== '');

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
      file ||
      `Status_Entregas_${from}-${to}-${filter.storeId.substr(
        filter.storeId.length - 3,
      )}${filter.userId.substr(filter.userId.length - 3)}.csv`;

    appendFileSync(`${directory_path}/${fileName}`, csv || '', {
      flag: 'a+',
    });

    return {
      path: `${directory_path}/${fileName}`,
      fileName,
    };
  }
}
