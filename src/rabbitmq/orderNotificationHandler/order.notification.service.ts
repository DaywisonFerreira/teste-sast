import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { ConsumeMessage, Channel } from 'amqplib';
import { OrderService } from '../../order/order.service';
import { IOrder } from '../../config/interfaces';
import { Env } from '../../commons/environment/env';

@Injectable()
export class OrderNotificationHandler {
  constructor(private readonly orderService: OrderService) {}

  @RabbitSubscribe({
    exchange: Env.ORDER_NOTIFICATION_EXCHANGE,
    routingKey: '',
    queue: 'ifc_logistic_api_core_order_notification_q',
    errorHandler: (channel: Channel, msg: ConsumeMessage, error: Error) => {
      // eslint-disable-next-line no-console
      console.log(error);
      channel.reject(msg, false);
    },
  })
  public async orderNotificationHandler(order: IOrder) {
    // eslint-disable-next-line no-console
    console.log(
      'handleOrderNotification.message',
      `Order ${order.externalOrderId} was received in the integration queue`,
    );
    try {
      if (order.status === 'dispatched' || order.status === 'invoiced') {
        // if (order.status === 'dispatched' || order.status === 'invoiced' || order.status === 'ready-for-handling') {
        const orderToSave = this.mapMessageToOrder(order);
        await this.orderService.merge(
          { orderSale: orderToSave.orderSale },
          orderToSave,
        );
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error.message, { payload: JSON.stringify(order) });
    }
  }

  private mapMessageToOrder(payload: IOrder) {
    const {
      _id: orderId,
      deliveryAddress,
      erpInfo,
      externalOrderId,
      packageAttachment,
      logisticInfo: logisticInfoRaw,
      updatedAt,
      history,
      creationDate,
      customer,
      internalOrderId,
      status,
      affiliateId,
      storeCode,
      storeId,
      sellerCode,
      sellerId,
    } = payload;
    let paymentDate;
    let deliveryDate;

    const historyApproved = history.find(
      ({ status }) => status === 'approved-in-origin',
    );
    if (historyApproved) {
      paymentDate = historyApproved.date;
    }

    const historyDelivered = history.find(
      ({ status }) => status === 'delivered',
    );
    if (historyDelivered) {
      deliveryDate = historyDelivered.date;
    }

    const logisticInfo = Array.isArray(logisticInfoRaw)
      ? logisticInfoRaw.map(l => ({
          ...l,
          price: this.parseFloat(l.price),
          listPrice: this.parseFloat(l.listPrice),
          sellingPrice: this.parseFloat(l.sellingPrice),
        }))
      : [];

    return {
      orderId,
      storeCode,
      storeId,
      sellerCode,
      sellerId,
      internalOrderId,
      receiverName: deliveryAddress.receiverName,
      receiverEmail: customer.email,
      receiverPhones: customer.phones,
      salesChannel: affiliateId,
      deliveryCity: deliveryAddress.city,
      deliveryState: deliveryAddress.state,
      deliveryZipCode: deliveryAddress.postalCode,
      orderSale: externalOrderId,
      order: erpInfo.externalOrderId,
      billingData: Array.isArray(packageAttachment.packages)
        ? packageAttachment.packages.map(p => ({
            ...p,
            invoiceValue: this.parseFloat(p.invoiceValue),
            items: Array.isArray(p.items)
              ? p.items.map((i: Partial<{ price: any }>) => ({
                  ...i,
                  price: this.parseFloat(i.price),
                }))
              : [],
          }))
        : [],
      logisticInfo,
      status,
      totalShippingPrice: logisticInfo.length
        ? logisticInfo.reduce((t, { sellingPrice }) => t + sellingPrice, 0)
        : 0,
      orderUpdatedAt: updatedAt,
      deliveryDate,
      orderCreatedAt: creationDate,
      paymentDate,
      dispatchDate: '',
      estimateDeliveryDateDeliveryCompany: '',
      partnerMessage: '',
      numberVolumes: '',
      partnerStatus: '',
      originZipCode: '',
      square: '',
      physicalWeight: '',
      lastOccurrenceMacro: '',
      lastOccurrenceMicro: '',
      lastOccurrenceMessage: '',
      quantityOccurrences: '',
      partnerUpdatedAt: '',
    };
  }

  private parseFloat(value: any): number {
    if (!value) {
      return 0;
    }
    return Number.parseFloat(
      value && value.$numberDecimal ? value.$numberDecimal : value,
    );
  }
}
