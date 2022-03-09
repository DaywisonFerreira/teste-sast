import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogProvider } from '@infralabs/infra-logger';
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

  async intelipost(payload: CreateIntelipost, logger: LogProvider) {
    const order: Partial<OrderDocument> =
      OrderMapper.mapPartnerToOrder(payload);

    if (order.partnerStatus === 'delivered') {
      // Entregue // Avaria // Extravio // Roubo // Em devolução // Aguardando retirada na agência dos Correios
      order.status = order.partnerStatus;
    }

    if (order.partnerStatus === 'shipped') {
      order.status = 'dispatched';
    }

    await this.orderService.merge(
      {
        orderSale: order.orderSale,
        invoiceKeys: order.invoice.key,
      },
      { ...order },
      'intelipost',
    );

    const orderMerged = await this.OrderModel.findOne({
      orderSale: order.orderSale,
      'invoice.key': order.invoice.key,
    });

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

      logger.log({
        message: `Message sent to exchange ${exchange} and routeKey ${routeKey}`,
        data: exportingOrder,
      });
    } else {
      logger.log(
        `${order.orderSale} order not sent due to lack of storeId (${orderMerged.storeId}), storeCode (${orderMerged.storeCode}) or internalOrderId (${orderMerged.internalOrderId})`,
      );
    }
  }
}
