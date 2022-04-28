import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { differenceInDays, isBefore } from 'date-fns';
import { LeanDocument, Model, Types } from 'mongoose';
import * as moment from 'moment';
import { KafkaService } from '@infralabs/infra-nestjs-kafka';
import {
  AccountDocument,
  AccountEntity,
} from 'src/account/schemas/account.schema';
import { Env } from 'src/commons/environment/env';
import { MessageOrderNotified } from 'src/intelipost/factories';
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
      orderId: { $in: [orderId, new Types.ObjectId(orderId)] },
    }).lean();

    if (!order) {
      throw new HttpException('Order not found.', HttpStatus.NOT_FOUND);
    }

    return order;
  }

  async exportData(
    { orderCreatedAtFrom, orderCreatedAtTo, storeId },
    options: any,
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

    return this.OrderModel.find(conditions, {}, options);
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
    headers: any,
    configPK: any,
    data: any = {},
    origin: string,
    options: any = { new: true, runValidators: true, useFindAndModify: false },
  ) {
    const orders = await this.OrderModel.find(configPK);
    let orderToNotified;

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

    if (orderToNotified.storeId) {
      const account = await this.accountModel
        .findOne({ id: orderToNotified.storeId })
        .lean();

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
      totals,
      value,
      orderSale,
      order: orderERP,
      orderCreatedAt,
      estimateDeliveryDateDeliveryCompany,
      logisticInfo,
      invoice,
      history,
      internalOrderId,
      statusCode,
    } = order;

    /**
     * History array order by ASC
     */
    const historyOrderByASC = history.sort((a, b) => {
      return moment(a.orderUpdatedAt).diff(b.orderUpdatedAt);
    });

    /**
     * Steppers
     */
    const steppers = historyOrderByASC
      .map(hist => (hist?.statusCode?.macro ? hist.statusCode.macro : ''))
      .filter(x => x !== '');

    /**
     * Total values
     */
    const values = {
      totalValueItems: totals.find(total => total.id === 'Items').value,
      totalDiscounts: totals.find(total => total.id === 'Discounts').value,
      totalShipping: totals.find(total => total.id === 'Shipping').value,
      value,
    };

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
    };

    return data;
  }
}
