import { v4 as uuidV4 } from 'uuid';

// KAFKA_TOPIC_INTELIPOST_ORDER_COMPENSATOR
export const MessageIntelipostToIntegrate = payload => {
  return {
    headers: {
      'X-Correlation-Id': uuidV4(),
      'X-Version': '1.0',
    },
    key: JSON.stringify({
      accountId: payload.accountId,
      orderNumber: payload.order.internalOrderId,
    }),
    value: JSON.stringify({
      data: {
        accountId: payload.accountId,
        orderNumber: payload.order.internalOrderId,
      },
    }),
  };
};

// KAFKA_TOPIC_INTELIPOST_CREATED
export const MessageIntelipostCreated = content => {
  const { createIntelipost, headers } = content;
  return {
    headers: {
      'X-Correlation-Id':
        headers['X-Correlation-Id'] || headers['x-correlation-id'] || uuidV4(),
      'X-Version': '1.0',
    },
    key: uuidV4(),
    value: JSON.stringify({
      data: {
        ...createIntelipost,
      },
    }),
  };
};

// KAFKA_TOPIC_ORDER_NOTIFIED
export const MessageOrderNotified = content => {
  const { order, invoice, account, headers } = content;

  const orderMapper: any = {};

  orderMapper.id = order.id;
  orderMapper.orderSale = order.orderSale;
  orderMapper.orderUpdatedAt = order.orderUpdatedAt;
  orderMapper.orderCreatedAt = order.orderCreatedAt;
  orderMapper.internalOrderId = order.internalOrderId;
  orderMapper.partnerOrder = order.partnerOrder;

  orderMapper.statusCode = {
    micro: order.statusCode?.micro || '',
    macro: order.statusCode?.macro || '',
    eventDate: order.dispatchDate || '',
  };

  orderMapper.invoice = {
    key: order.invoice?.key || '',
    value: order.invoice?.value || 0,
    number: order.invoice?.number || '',
    trackingUrl: order.invoice?.trackingUrl || '',
  };

  orderMapper.carrier = {
    name: order.invoice?.carrierName || '',
    document: order.invoice?.carrierDocument || '',
  };

  orderMapper.deliveryMode = {
    name: order.logisticInfo?.length
      ? order.logisticInfo[0].logisticContract
      : '',
  };

  orderMapper.deliveryDate = order.deliveryDate;

  if (invoice?.receiver) {
    orderMapper.customer = {
      firstName:
        invoice?.receiver?.name.split(' ').slice(0, -1).join(' ') || '',
      lastName: invoice?.receiver?.name.split(' ').slice(-1).join(' ') || '',
      fullName: invoice?.receiver?.name || '',
      document: invoice?.receiver?.document || '',
      documentType: invoice?.receiver?.documentType || '',
      address: {
        city: invoice?.receiver?.address?.city || '',
        state: invoice?.receiver?.address?.state || '',
        zipcode: invoice?.receiver?.address?.zipCode || '',
        neighborhood: invoice?.receiver?.address?.country || '',
      },
    };
  } else if (order.customer) {
    orderMapper.customer = {
      firstName: order.customer?.firstName,
      lastName: order.customer?.lastName,
      fullName: order.customer?.fullName || '',
      document: order.customer?.document || '',
      documentType: order.customer?.documentType || '',
      address: {
        city: order?.delivery?.city || '',
        state: order?.delivery?.state || '',
        zipcode: order?.delivery?.zipCode || '',
        neighborhood: order?.delivery?.neighborhood || '',
      },
    };
  }

  orderMapper.location = {
    id: account.id,
    name: account.name,
    document: account.document,
    address: {
      city: account.address?.city || '',
      state: account.address?.state || '',
      zipcode: account.address?.zipcode || '',
      neighborhood: account.address?.neighborhood || '',
    },
  };

  if (invoice?.packages.length) {
    orderMapper.packages = invoice?.packages?.map(item => {
      return {
        productsQuantity: item?.productsQuantity,
        volume: item?.volume,
        grossWeight: item?.grossWeight,
        netWeight: item?.netWeight,
        width: item?.width,
        height: item?.height,
        length: item?.length,
        trackingCode: item?.trackingCode,
      };
    });
  }

  orderMapper.shippingEstimateDate = order.estimateDeliveryDateDeliveryCompany;

  return {
    headers: {
      'X-Tenant-Id': orderMapper.accountId,
      'X-Correlation-Id':
        headers['X-Correlation-Id'] || headers['x-correlation-id'] || uuidV4(),
      'X-Version': '1.0',
    },
    key: { 'X-Tenant-Id': account.id, orderNumber: order.partnerOrder },
    value: JSON.stringify({
      data: orderMapper,
    }),
  };
};
