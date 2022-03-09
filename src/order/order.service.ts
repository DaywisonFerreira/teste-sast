import { LogProvider } from '@infralabs/infra-logger';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { differenceInDays, isBefore } from 'date-fns';
import { LeanDocument, Model, Types } from 'mongoose';
import { IFilterObject } from 'src/commons/interfaces/filter-object.interface';
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
    @Inject('LogProvider') private logger: LogProvider,
  ) {
    this.logger.context = OrderService.name;
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
    orderUpdatedAtFrom,
    orderUpdatedAtTo,
    status,
    // partnerStatus,
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

    // if (partnerStatus) {
    //   filter.partnerStatus = {
    //     $regex: `${partnerStatus}.*`,
    //     $options: 'i',
    //   };
    // }

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
    options: any,
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

    return this.OrderModel.find(conditions, {}, options);
  }

  private generateHistory(data, origin, isCreate) {
    let updateHistory = {};
    if (origin === 'intelipost') {
      const history = {
        dispatchDate: data.dispatchDate,
        estimateDeliveryDateDeliveryCompany:
          data.estimateDeliveryDateDeliveryCompany,
        partnerMessage: data.partnerMessage,
        microStatus: data.microStatus,
        lastOccurrenceMacro: data.lastOccurrenceMacro,
        lastOccurrenceMicro: data.lastOccurrenceMicro,
        lastOccurrenceMessage: data.lastOccurrenceMessage,
        partnerStatus: data.partnerStatus,
        orderUpdatedAt: data.orderUpdatedAt,
        i18n: data.i18n,
      };
      updateHistory = isCreate
        ? {
            history: [history],
          }
        : { $push: { history } };
    }
    return updateHistory;
  }

  private async createOrder(data, origin) {
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
    return this.OrderModel.updateMany(
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
    const orders = await this.OrderModel.find(configPK);

    if (!orders.length) {
      await this.createOrder(data, origin);
    }
    if (orders.length > 1) {
      await this.updateOrdersWithMultipleInvoices(
        configPK,
        data,
        origin,
        options,
      );
    } else {
      await this.updateOrder(configPK, data, orders[0], origin, options);
    }
  }

  private validateRangeOfDates(dateFrom: Date, dateTo: Date) {
    if (differenceInDays(dateTo, dateFrom) > 62) {
      throw new Error('Date difference greater than 2 months');
    }

    if (isBefore(dateTo, dateFrom)) {
      throw new Error('Invalid range of dates');
    }
  }
}
