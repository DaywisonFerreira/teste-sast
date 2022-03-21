import { Types } from 'mongoose';
import { CreateIntelipost } from 'src/intelipost/dto/create-intelipost.dto';
import { IHubOrder } from '../interfaces/order.interface';
import { OrderDocument } from '../schemas/order.schema';

export class OrderMapper {
  static mapPartnerToOrder(payload: CreateIntelipost): Partial<OrderDocument> {
    const status =
      typeof payload.history.shipment_order_volume_state === 'string'
        ? payload.history.shipment_order_volume_state
            .toLowerCase()
            .replace(/_/g, '-')
        : payload.history.shipment_order_volume_state;

    return {
      orderSale: payload.sales_order_number,
      partnerOrder: payload.order_number,
      orderUpdatedAt: new Date(payload.history.event_date_iso),
      invoiceKeys: [payload.invoice.invoice_key],
      invoice: {
        key: payload.invoice.invoice_key,
        serie: payload.invoice.invoice_series,
        number: payload.invoice.invoice_number,
      },
      dispatchDate: new Date(payload.history.created_iso),
      estimateDeliveryDateDeliveryCompany: payload?.estimated_delivery_date
        ?.client
        ? new Date(payload.estimated_delivery_date.client.current_iso)
        : null,
      partnerMessage: payload.history.provider_message,
      numberVolumes: parseInt(payload.volume_number, 10),
      microStatus: payload.history.shipment_volume_micro_state.name,
      lastOccurrenceMacro: payload.history.esprinter_message,
      lastOccurrenceMicro:
        payload.history.shipment_volume_micro_state.default_name,
      lastOccurrenceMessage:
        payload.history.shipment_volume_micro_state.description,
      partnerStatus: status,
      i18n: payload.history.shipment_volume_micro_state.i18n_name,
    };
  }

  static mapPartnerToExportingOrder(payload: Partial<OrderDocument>): any {
    const i18nName =
      typeof payload.i18n === 'string'
        ? payload.i18n.toLowerCase().replace(/_/g, '-')
        : payload.i18n;

    return {
      storeId: payload.storeId,
      storeCode: payload.storeCode,
      externalOrderId: payload.orderSale,
      internalOrderId: parseInt(payload.internalOrderId, 10),
      shippingEstimateDate: payload.estimateDeliveryDateDeliveryCompany,
      eventDate: payload.orderUpdatedAt,
      partnerMessage: payload.partnerMessage,
      numberVolumes: payload.numberVolumes,
      microStatus: payload.microStatus,
      occurrenceMacro: payload.lastOccurrenceMacro,
      occurrenceMicro: payload.lastOccurrenceMicro,
      occurrenceMessage: payload.lastOccurrenceMessage,
      partnerStatus: payload.partnerStatus,
      i18nName: i18nName === 'cancelled' ? 'canceled' : i18nName,
      status:
        payload.partnerStatus === 'cancelled'
          ? 'canceled'
          : payload.partnerStatus,
      invoiceNumber: payload.invoice.number,
    };
  }

  static mapMessageToOrders(payload: IHubOrder): Array<Partial<OrderDocument>> {
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
      value,
      totals,
    } = payload;
    let paymentDate: Date;
    let deliveryDate: Date;

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

    const arrayOfBillingData = Array.isArray(packageAttachment.packages)
      ? packageAttachment.packages.map(p => ({
          ...p,
          invoiceValue: this.parseFloat(p.invoiceValue),
          items: Array.isArray(p.items)
            ? p.items.map(
                ({ _id, ...i }: Partial<{ _id: string; price: any }>) => ({
                  ...i,
                  price: this.parseFloat(i.price),
                }),
              )
            : [],
        }))
      : [];

    return arrayOfBillingData.map(billingData => ({
      orderId,
      storeCode,
      storeId: new Types.ObjectId(storeId),
      sellerCode,
      sellerId: new Types.ObjectId(sellerId),
      internalOrderId: `${internalOrderId}`,
      receiverName: deliveryAddress.receiverName, // @deprecated
      receiverEmail: customer.email, // @deprecated
      receiverPhones: customer.phones, // @deprecated
      salesChannel: affiliateId,
      deliveryCity: deliveryAddress.city, // @deprecated
      deliveryState: deliveryAddress.state, // @deprecated
      deliveryZipCode: deliveryAddress.postalCode, // @deprecated
      orderSale: externalOrderId,
      order: erpInfo.externalOrderId,
      partnerOrder: erpInfo.externalOrderId,
      billingData: arrayOfBillingData, // @deprecated
      logisticInfo,
      status,
      totalShippingPrice: logisticInfo.length
        ? logisticInfo.reduce((t, { sellingPrice }) => t + sellingPrice, 0)
        : 0,
      orderUpdatedAt: updatedAt,
      deliveryDate,
      orderCreatedAt: creationDate,
      paymentDate,
      invoiceKeys: arrayOfBillingData.map(({ invoiceKey }) => invoiceKey),
      totals: totals.map(total => ({
        id: total.id,
        name: total.name,
        value: this.parseFloat(total.value),
      })),
      value: this.parseFloat(value),
      invoice: {
        serie: billingData.invoiceSerialNumber,
        value: this.parseFloat(billingData.invoiceValue),
        number: billingData.invoiceNumber,
        key: billingData.invoiceKey,
        issuanceDate: billingData.issuanceDate,
        carrierName: billingData.carrierName,
        trackingNumber: billingData.trackingNumber,
        trackingUrl: billingData.trackingUrl,
        items: billingData.items,
        customerDocument: billingData.customerDocument,
      },
      delivery: {
        receiverName: deliveryAddress.receiverName,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        zipCode: deliveryAddress.postalCode,
        country: deliveryAddress.country,
      },
      customer: {
        phones: customer.phones,
        email: customer.email,
        isCorporate: customer.isCorporate,
        firstName: customer.firstName,
        lastName: customer.lastName,
        document: customer.document,
        documentType: customer.documentType,
        corporateName: customer.corporateName,
        fullName: customer.fullName,
      },
    }));
  }

  static parseFloat(value: any): number {
    if (!value) {
      return 0;
    }
    return Number.parseFloat(
      value && value.$numberDecimal ? value.$numberDecimal : value,
    );
  }
}
