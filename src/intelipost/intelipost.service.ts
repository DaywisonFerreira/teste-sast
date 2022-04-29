import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InfraLogger } from '@infralabs/infra-logger';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

import { OrderMapper } from '../order/mappers/orderMapper';
import { OrderDocument, OrderEntity } from '../order/schemas/order.schema';
import { CreateIntelipost } from './dto/create-intelipost.dto';
import { OrderService } from '../order/order.service';

@Injectable()
export class InteliPostService {
  constructor(
    @InjectModel(OrderEntity.name)
    private OrderModel: Model<OrderDocument>,
    private orderService: OrderService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async intelipost(payload: CreateIntelipost, logger: InfraLogger) {
    const order: Partial<OrderDocument> =
      OrderMapper.mapPartnerToOrder(payload);

    if (order.partnerStatus === 'delivered') {
      order.status = order.partnerStatus;
      order.deliveryDate = order.orderUpdatedAt;
    }

    if (order.partnerStatus === 'shipped') {
      order.status = 'dispatched';
    }

    const orderMerged = await this.orderService.merge(
      {
        orderSale: order.orderSale,
        invoiceKeys: order.invoice.key,
      },
      { ...order },
      'intelipost',
    );

    if (
      orderMerged.storeId &&
      orderMerged.storeCode &&
      orderMerged.internalOrderId &&
      !Number.isNaN(parseInt(orderMerged.internalOrderId, 10))
    ) {
      const exchange = 'order';
      const routeKey = 'orderTrackingUpdated';
      const exportingOrder: any =
        OrderMapper.mapPartnerToExportingOrder(orderMerged);

      await this.amqpConnection.publish(exchange, routeKey, exportingOrder);

      logger.log(
        `Order ${order.orderSale} sent to exchange '${exchange}' and routeKey '${routeKey}'`,
      );
    } else {
      logger.log(
        `${order.orderSale} order not sent due to lack of storeId (${orderMerged.storeId}), storeCode (${orderMerged.storeCode}) or internalOrderId (${orderMerged.internalOrderId})`,
      );
    }

    return orderMerged;
  }
}
