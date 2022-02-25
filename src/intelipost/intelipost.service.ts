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
    const status =
      typeof payload.history.shipment_order_volume_state === 'string'
        ? payload.history.shipment_order_volume_state
            .toLowerCase()
            .replace(/_/g, '-')
        : payload.history.shipment_order_volume_state;

    const order: any = {
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
      partnerStatus: status,
      orderUpdatedAt: payload.history.event_date_iso,
      i18n: payload.history.shipment_volume_micro_state.i18n_name,
    };

    if (status === 'delivered') {
      // Entregue // Avaria // Extravio // Roubo // Em devolução // Aguardando retirada na agência dos Correios
      order.status = status;
    }

    await this.orderService.merge(
      {
        orderSale: order.orderSale,
        'invoice.key': payload.invoice.key,
      },
      // { orderSale: order.orderSale, partnerOrder: order.partnerOrder },
      order,
      'intelipost',
    );

    const orderMerged = await this.OrderModel.findOne({
      orderSale: payload.sales_order_number,
    });

    if (
      orderMerged.storeId &&
      orderMerged.storeCode &&
      orderMerged.internalOrderId &&
      !Number.isNaN(parseInt(orderMerged.internalOrderId, 10))
    ) {
      const exchange = 'order';
      const routeKey = 'orderTrackingUpdated';
      const i18nName =
        typeof order.i18n === 'string'
          ? order.i18n.toLowerCase().replace(/_/g, '-')
          : order.i18n;

      const exportingOrder = {
        storeId: orderMerged.storeId,
        storeCode: orderMerged.storeCode,
        externalOrderId: order.orderSale,
        internalOrderId: parseInt(orderMerged.internalOrderId, 10),
        shippingEstimateDate: order.estimateDeliveryDateDeliveryCompany,
        eventDate: order.orderUpdatedAt,
        partnerMessage: order.partnerMessage,
        numberVolumes: order.numberVolumes,
        microStatus: order.microStatus,
        occurrenceMacro: order.lastOccurrenceMacro,
        occurrenceMicro: order.lastOccurrenceMicro,
        occurrenceMessage: order.lastOccurrenceMessage,
        partnerStatus: order.partnerStatus,
        i18nName: i18nName === 'cancelled' ? 'canceled' : i18nName,
        status: status === 'cancelled' ? 'canceled' : status,
        invoiceNumber: payload.invoice.number,
      };

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
