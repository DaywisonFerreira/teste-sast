import { Injectable } from '@nestjs/common';
import { InfraLogger } from '@infralabs/infra-logger';

import { OrderService } from 'src/order/order.service';
import { OrderProducer } from 'src/order/producer/order.producer';
import { OrderDocument } from 'src/order/schemas/order.schema';
import { OrderMapper } from '../order/mappers/orderMapper';
import { CreateIntelipost } from './dto/create-intelipost.dto';

@Injectable()
export class InteliPostService {
  constructor(
    private orderService: OrderService,
    private orderProducer: OrderProducer,
  ) {}

  async intelipost(
    payload: CreateIntelipost,
    logger: InfraLogger,
    headers: any,
    extra: Record<string, any> = {},
    needChangeDispatchStatus = true,
  ) {
    try {
      // eslint-disable-next-line no-param-reassign
      logger.context = InteliPostService.name;
      let order = OrderMapper.mapPartnerToOrder(payload, extra);

      if (order.statusCode.macro === 'delivered') {
        order.status = order.statusCode.macro;
        order.deliveryDate = order.orderUpdatedAt;
      }

      if (needChangeDispatchStatus) {
        order = this.changeDispatchStatus(order);
      } else if (order.statusCode.macro === 'order-dispatched') {
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
        let needToDispatch = false;
        if (needChangeDispatchStatus && Array.isArray(orderMerged.history)) {
          const historyStatusCodes = orderMerged.history.map(
            ({ statusCode }) => statusCode?.micro,
          );
          if (
            historyStatusCodes.length === 3 &&
            historyStatusCodes.includes('created') &&
            historyStatusCodes.includes('waiting-for-collection') &&
            orderMerged.partnerStatus !== 'cancelled'
          ) {
            needToDispatch = true;
          }
        }

        if (needToDispatch) {
          await this.intelipost(
            {
              ...payload,
              history: {
                ...payload.history,
                shipment_order_volume_state: 'SHIPPED',
                shipment_volume_micro_state: {
                  ...payload.history.shipment_volume_micro_state,
                  id: 69,
                  shipment_order_volume_state_id: 9,
                },
              },
            },
            logger,
            headers,
            extra,
            false,
          );
        }

        if (
          !needChangeDispatchStatus &&
          order.statusCode.macro === 'order-dispatched'
        ) {
          orderMerged.status = order.status;
          orderMerged.partnerStatus = order.partnerStatus;
          orderMerged.statusCode = order.statusCode;
        }

        logger.log(
          `OrderSale: ${orderMerged.orderSale} order: ${orderMerged.partnerOrder} and microStatus: ${orderMerged.statusCode.micro} was saved`,
        );

        await this.orderProducer.sendStatusTrackingToIHub(orderMerged, logger);
      } else {
        logger.log(
          `OrderSale: ${orderMerged.orderSale} order: ${orderMerged.partnerOrder} and microStatus: ${orderMerged.statusCode.micro} was NOT saved`,
        );
      }
    } catch (error) {
      logger.error(error);
    }
  }

  // Task code: C30F-1788
  // When received dispatched from intelipost, mark order with waiting-for-collection
  private changeDispatchStatus(order: Partial<OrderDocument>) {
    const result = { ...order };

    if (order.partnerStatus === 'shipped') {
      result.partnerStatus = 'waiting-for-collection';
    }

    if (order.statusCode.macro === 'order-dispatched') {
      result.statusCode.macro = 'order-created';
    }

    if (order.statusCode.micro === 'dispatched') {
      result.statusCode.micro = 'waiting-for-collection';
    }

    return result;
  }
}
