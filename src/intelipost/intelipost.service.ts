import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InfraLogger } from '@infralabs/infra-logger';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

import { OrderService } from 'src/order/order.service';
import { OrderMapper } from '../order/mappers/orderMapper';
import { OrderDocument, OrderEntity } from '../order/schemas/order.schema';
import { CreateIntelipost } from './dto/create-intelipost.dto';

@Injectable()
export class InteliPostService {
  constructor(
    @InjectModel(OrderEntity.name)
    private OrderModel: Model<OrderDocument>,
    private orderService: OrderService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async intelipost(
    payload: CreateIntelipost,
    logger: InfraLogger,
    headers: any,
  ) {
    try {
      const order = await OrderMapper.mapPartnerToOrder(payload);

      if (order.statusCode.macro === 'delivered') {
        order.status = order.statusCode.macro;
        order.deliveryDate = order.orderUpdatedAt;
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
        { ...order },
        'intelipost',
        logger,
      );

      if (success) {
        logger.log(
          `Order with invoiceKey ${orderMerged.invoice.key} was saved`,
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
          `Order ${orderMerged.orderSale} sent to exchange '${exchange}' and routeKey '${routeKey}'`,
        );
      } else {
        logger.log(
          `${order.orderSale} order not sent due to lack of storeId (${orderMerged.storeId}), storeCode (${orderMerged.storeCode}) or internalOrderId (${orderMerged.internalOrderId})`,
        );
      }
    } catch (error) {
      logger.error(error);
    }
  }
}
