import { Inject, Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

import { LogProvider } from 'src/commons/providers/log/log-provider.interface';
import { OrderMapper } from '../mappers/orderMapper';
import { OrderDocument } from '../schemas/order.schema';

@Injectable()
export class OrderProducer {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Inject('LogProvider')
    private readonly logger: LogProvider,
  ) {
    this.logger.instanceLogger(OrderProducer.name);
  }

  async sendStatusTrackingToIHub(order: Partial<OrderDocument>) {
    if (
      order.storeId &&
      order.storeCode &&
      order.internalOrderId &&
      !Number.isNaN(parseInt(order.internalOrderId, 10))
    ) {
      const exchange = 'order';
      const routeKey = 'orderTrackingUpdated';
      const exportingOrder: any = OrderMapper.mapPartnerToExportingOrder(order);

      await this.amqpConnection.publish(exchange, routeKey, exportingOrder);

      this.logger.log(
        {
          key: 'ifc.freight.api.order.order-producer.sendStatusTrackingToIHub.sent',
          message: `OrderSale: ${order.orderSale} order ${order.partnerOrder} sent to exchange '${exchange}' and routeKey '${routeKey}' status: ${order.partnerStatus}`,
        },
        {},
      );
    } else {
      this.logger.log(
        {
          key: 'ifc.freight.api.order.order-producer.sendStatusTrackingToIHub.not-sent',
          message: `OrderSale: ${order.orderSale} order ${order.partnerOrder} not sent due to lack of storeId (${order.storeId}), storeCode (${order.storeCode}) or internalOrderId (${order.internalOrderId}) status: ${order.partnerStatus}`,
        },
        {},
      );
    }
  }
}
