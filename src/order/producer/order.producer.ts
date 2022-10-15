import { Injectable } from '@nestjs/common';
import { InfraLogger } from '@infralabs/infra-logger';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

import { OrderMapper } from '../mappers/orderMapper';
import { OrderDocument } from '../schemas/order.schema';

@Injectable()
export class OrderProducer {
  constructor(
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async sendStatusTrackingToIHub(
    order: Partial<OrderDocument>,
    logger: InfraLogger,
  ) {
    if (
      order.storeId &&
      order.storeCode &&
      order.internalOrderId &&
      !Number.isNaN(parseInt(order.internalOrderId, 10))
    ) {
      const exchange = 'order';
      const routeKey = 'orderTrackingUpdated';
      const exportingOrder: any =
        OrderMapper.mapPartnerToExportingOrder(order);

      await this.amqpConnection.publish(exchange, routeKey, exportingOrder);

      logger.log(
        `OrderSale: ${order.orderSale} order ${order.partnerOrder} sent to exchange '${exchange}' and routeKey '${routeKey}' status: ${order.partnerStatus}`,
      );
    } else {
      logger.log(
        `OrderSale: ${order.orderSale} order ${order.partnerOrder} not sent due to lack of storeId (${order.storeId}), storeCode (${order.storeCode}) or internalOrderId (${order.internalOrderId}) status: ${order.partnerStatus}`,
      );
    }
  }
}
