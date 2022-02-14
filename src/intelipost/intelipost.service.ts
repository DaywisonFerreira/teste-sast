import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogProvider } from '@infralabs/infra-logger';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

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

  async inteliPost(payload: CreateIntelipost, logger: LogProvider) {
    const order = {
      orderSale: payload.sales_order_number,
      partnerOrder: payload.order_number,
      dispatchDate: payload.history.created_iso,
      estimateDeliveryDateDeliveryCompany:
        payload.estimated_delivery_date.client.current_iso,
      partnerMessage: payload.history.provider_message,
      numberVolumes: payload.volume_number,
      microStatus: payload.history.shipment_volume_micro_state.name,
      lastOccurrenceMacro: payload.history.esprinter_message,
      lastOccurrenceMicro:
        payload.history.shipment_volume_micro_state.default_name,
      lastOccurrenceMessage:
        payload.history.shipment_volume_micro_state.description,
      partnerStatus: payload.history.shipment_order_volume_state_localized,
      partnerUpdatedAt: payload.history.event_date_iso,
      i18n: payload.history.shipment_volume_micro_state.i18n_name,
    };

    await this.orderService.merge(
      { orderSale: payload.sales_order_number },
      order,
      'intelipost',
    );

    const orderMerged = await this.OrderModel.findOne({
      orderSale: payload.sales_order_number,
    });

    if (orderMerged.storeId && orderMerged.storeCode) {
      const exchange = 'order';
      const routeKey = 'orderTrackingUpdated';
      const internalOrderId = payload.order_number.split('-').length > 1
        ? payload.order_number.split('-')[1]
        : payload.order_number;
      const i18nName =
        typeof order.i18n === 'string'
          ? order.i18n.toLowerCase().replace(/_/g, '-')
          : order.i18n;
      const status =
        typeof payload.history.shipment_order_volume_state === 'string'
          ? payload.history.shipment_order_volume_state
              .toLowerCase()
              .replace(/_/g, '-')
          : payload.history.shipment_order_volume_state;

      const exportingOrder = {
        storeId: orderMerged.storeId,
        storeCode: orderMerged.storeCode,
        externalOrderId: order.orderSale,
        internalOrderId: Number.parseInt(internalOrderId, 10),
        shippingEstimateDate: order.estimateDeliveryDateDeliveryCompany,
        eventDate: order.partnerUpdatedAt,
        partnerMessage: order.partnerMessage,
        numberVolumes: order.numberVolumes,
        microStatus: order.microStatus,
        occurrenceMacro: order.lastOccurrenceMacro,
        occurrenceMicro: order.lastOccurrenceMicro,
        occurrenceMessage: order.lastOccurrenceMessage,
        partnerStatus: order.partnerStatus,
        i18nName: i18nName === 'cancelled' ? 'canceled' : i18nName,
        status: status === 'cancelled' ? 'canceled' : status,
        invoiceNumber: payload.invoice.invoice_number,
      };

      await this.amqpConnection.publish(exchange, routeKey, exportingOrder);
      // tasks.send(exchange, routeKey, exportingOrder);
      logger.add('postIntelipost.sent', {
        message: `Message sent to exchange ${exchange} and routeKey ${routeKey}`,
        payload: exportingOrder,
      });
    } else {
      logger.log(
        `${order.orderSale} order not sent due to lack of storeId storeCode`,
      );
    }
  }
}
