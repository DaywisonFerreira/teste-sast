import { v4 as uuidV4 } from 'uuid';

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
  const { order: payload, account, headers } = content;

  const orderMapper: any = {};

  orderMapper.id = payload.id;
  orderMapper.orderSale = payload.orderSale;
  orderMapper.orderUpdatedAt = payload.orderUpdatedAt;
  orderMapper.orderCreatedAt = payload.orderCreatedAt;
  orderMapper.internalOrderId = payload.internalOrderId;
  orderMapper.partnerOrder = payload.partnerOrder;

  orderMapper.statusCode = {
    micro: payload.statusCode?.micro || '',
    macro: payload.statusCode?.macro || '',
  };

  orderMapper.invoice = {
    value: payload.invoice?.value || 0,
    number: payload.invoice?.number || '',
    trackingUrl: payload.invoice?.trackingUrl || '',
    customerDocument: payload.invoice?.customerDocument || '',
  };

  orderMapper.carrier = {
    name: payload.invoice?.carrierName || '',
    document: payload.invoice?.carrierDocument || '',
  };

  orderMapper.deliveryDate = payload.deliveryDate;
  orderMapper.accountName = account?.name || '';
  orderMapper.accountId = account?.id || '';

  if (payload.customer) {
    orderMapper.customer = {
      firstName: payload.customer?.firstName || '',
      lastName: payload.customer?.lastName || '',
      fullName: payload.customer?.fullName || '',
      document: payload.customer?.document || '',
      documentType: payload.customer?.documentType || '',
    };
  }

  orderMapper.shippingEstimateDate =
    payload.estimateDeliveryDateDeliveryCompany;

  orderMapper.deliveryCompany = payload.logisticInfo?.length ? (payload.logisticInfo[0].deliveryCompany || '') : '';

  return {
    headers: {
      'X-Tenant-Id': orderMapper.accountId,
      'X-Correlation-Id':
        headers['X-Correlation-Id'] || headers['x-correlation-id'] || uuidV4(),
      'X-Version': '1.0',
    },
    key: uuidV4(),
    value: JSON.stringify({
      data: orderMapper,
    }),
  };
};
