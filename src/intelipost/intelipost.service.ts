import { Injectable } from '@nestjs/common';
import { InfraLogger } from '@infralabs/infra-logger';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

import { OrderService } from 'src/order/order.service';
import { OrderMapper } from '../order/mappers/orderMapper';
import { CreateIntelipost } from './dto/create-intelipost.dto';

@Injectable()
export class InteliPostService {
  constructor(
    private orderService: OrderService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async intelipost(
    payload: CreateIntelipost,
    logger: InfraLogger,
    headers: any,
  ) {
    try {
      // eslint-disable-next-line no-param-reassign
      logger.context = InteliPostService.name;
      const order = OrderMapper.mapPartnerToOrder(payload);

      if (order.statusCode.macro === 'delivered') {
        order.status = order.statusCode.macro;
        order.deliveryDate = order.orderUpdatedAt;
      }

      if (order.statusCode.macro === 'order-dispatched') {
        order.dispatchDate = order.orderUpdatedAt;
      }

      if (order.partnerStatus === 'shipped') {
        order.status = 'dispatched';
      }

      const { success, order: orderMerged } = await this.orderService.merge(
        headers,
        {
          orderSale: order.orderSale,
          invoiceKeys: order.invoice.key,
        },
        { ...order, attachments: payload.history.attachments },
        'intelipost',
        logger,
      );

      if (success) {
        logger.log(
          `OrderSale: ${orderMerged.orderSale} order: ${orderMerged.partnerOrder} and microStatus: ${orderMerged.statusCode.micro} was saved`,
        );
      }

      if (
        success &&
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
          `OrderSale: ${orderMerged.orderSale} order ${orderMerged.partnerOrder} sent to exchange '${exchange}' and routeKey '${routeKey}' status: ${orderMerged.partnerStatus}`,
        );
      } else {
        logger.log(
          `OrderSale: ${orderMerged.orderSale} order ${orderMerged.partnerOrder} not sent due to lack of storeId (${orderMerged.storeId}), storeCode (${orderMerged.storeCode}) or internalOrderId (${orderMerged.internalOrderId}) status: ${orderMerged.partnerStatus}`,
        );
      }
    } catch (error) {
      logger.error(error);
    }
  }
}
