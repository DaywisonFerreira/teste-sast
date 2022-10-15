import { Injectable } from '@nestjs/common';
import { InfraLogger } from '@infralabs/infra-logger';

import { OrderService } from 'src/order/order.service';
import { OrderMapper } from '../order/mappers/orderMapper';
import { CreateIntelipost } from './dto/create-intelipost.dto';
import { OrderProducer } from 'src/order/producer/order.producer';

@Injectable()
export class InteliPostService {
  constructor(
    private orderService: OrderService,
    private orderProducer: OrderProducer
  ) {}

  async intelipost(
    payload: CreateIntelipost,
    logger: InfraLogger,
    headers: any,
    extra: Record<string, any> = {},
  ) {
    try {
      // eslint-disable-next-line no-param-reassign
      logger.context = InteliPostService.name;
      const order = OrderMapper.mapPartnerToOrder(payload, extra);

      if (order.statusCode.macro === 'delivered') {
        order.status = order.statusCode.macro;
        order.deliveryDate = order.orderUpdatedAt;
      }

      if (order.statusCode.macro === 'order-dispatched') {
        order.status = 'dispatched';
        order.dispatchDate = order.orderUpdatedAt;
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
        await this.orderProducer.sendStatusTrackingToIHub(orderMerged, logger);
      }
    } catch (error) {
      logger.error(error);
    }
  }
}
