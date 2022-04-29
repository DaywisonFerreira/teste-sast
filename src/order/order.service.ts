/* eslint-disable no-await-in-loop */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { appendFileSync } from 'graceful-fs';
import { InjectModel } from '@nestjs/mongoose';
import { differenceInDays, isBefore, lightFormat } from 'date-fns';
import { LeanDocument, Model, Types } from 'mongoose';
import { existsSync, mkdirSync } from 'fs';
import { utils } from 'xlsx';

import { CsvMapper } from './mappers/csvMapper';
import { OrderMapper } from './mappers/orderMapper';
import { chunkArray } from '../commons/utils/array.utils';
import { Env } from '../commons/environment/env';
import { IFilterObject } from '../commons/interfaces/filter-object.interface';
import {
  OrderDocument,
  OrderEntity,
  PublicFieldsOrder,
} from './schemas/order.schema';

@Injectable()
export class OrderService {
  constructor(
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
    status,
  }): Promise<[LeanDocument<OrderEntity[]>, number]> {
    const filter: IFilterObject = {
      status: { $in: ['dispatched', 'delivered', 'invoiced'] }, // Entregue // Avaria // Extravio // Roubo // Em devolução // Aguardando retirada na agência dos Correios
    };

    if (storeId) {
      filter.storeId = new Types.ObjectId(storeId);
    }

    if (status) {
      filter.status = {
        $in: status.split(','),
      };
    }

    if (search) {
      filter.$or = [
        { order: { $regex: `${search}.*`, $options: 'i' } },
        { orderSale: { $regex: `${search}.*`, $options: 'i' } },
        { partnerOrder: { $regex: `${search}.*`, $options: 'i' } },
        { receiverName: { $regex: `${search}.*`, $options: 'i' } },
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
      orderId,
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
      status: { $in: ['dispatched', 'delivered', 'invoiced'] }, // Entregue // Avaria // Extravio // Roubo // Em devolução // Aguardando retirada na agência dos Correios
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

    const file = this.createCsvLocally([], {
      orderCreatedAtFrom,
      orderCreatedAtTo,
      userId,
      storeId,
    });

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

        this.createCsvLocally(
          dataFormatted,
          { orderCreatedAtFrom, orderCreatedAtTo, userId, storeId },
          file.fileName,
        );
      }
    }
    return file;
  }

  private generateHistory(data, origin, isCreate) {
    let updateHistory = {};
    if (origin === 'intelipost') {
      const history = OrderMapper.mapPartnerHistoryToOrderHistory(data);
      updateHistory = isCreate
        ? {
            history: [history],
          }
        : { $push: { history } };
    }
    return updateHistory;
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

  private async updateOrder(configPK, data, currentOrder, origin, options) {
    return this.OrderModel.findOneAndUpdate(
      configPK,
      {
        ...data,
        invoice: {
          ...data.invoice,
          ...currentOrder.invoice,
        },
        invoiceKeys: [
          ...new Set([...data.invoiceKeys, ...currentOrder.invoiceKeys]),
        ],
        ...this.generateHistory(data, origin, false),
      },
      options,
    );
  }

  async merge(
    configPK: any,
    data: any = {},
    origin: string,
    options: any = { runValidators: true, useFindAndModify: false },
  ) {
    let orderToNotified: any;
    const orders = await this.OrderModel.find(configPK);
    if (!orders.length) {
      orderToNotified = await this.createOrder(data, origin);
    } else if (orders.length > 1) {
      orderToNotified = await this.updateOrdersWithMultipleInvoices(
        configPK,
        data,
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

  private createCsvLocally(data: unknown[], filter: any, file?: string) {
    const directory_path =
      process.env.NODE_ENV !== 'local'
        ? `${process.cwd()}/dist/tmp`
        : `${process.cwd()}/src/tmp`;

    if (!existsSync(directory_path)) {
      mkdirSync(directory_path);
    }

    const worksheet = utils.json_to_sheet(data);
    const csv = utils.sheet_to_csv(worksheet);

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

    appendFileSync(`${directory_path}/${fileName}`, csv ? `${csv},` : '', {
      flag: 'a+',
    });

    return {
      path: `${directory_path}/${fileName}`,
      fileName,
    };
  }
}
