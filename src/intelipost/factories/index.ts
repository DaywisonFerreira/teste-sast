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
  const { payload, account, headers } = content;

  const dispatchedEvent = payload.history?.find(
    x => x.microStatus === 'DESPACHADO',
  );

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
    eventDate: dispatchedEvent ? dispatchedEvent.orderUpdatedAt : '',
  };

  orderMapper.invoice = {
    value: payload.invoice?.value || 0,
    number: payload.invoice?.number || '',
    trackingUrl: payload.invoice?.trackingUrl || '',
  };

  orderMapper.carrier = {
    name: payload.invoice?.carrierName || '',
    document: payload.invoice?.carrierDocument || '',
  };

  orderMapper.deliveryMode = {
    name: payload.logisticInfo?.length
      ? payload.logisticInfo[0].logisticContract
      : '',
  };

  orderMapper.deliveryDate = payload.deliveryDate;
  orderMapper.accountName = account?.name || '';
  orderMapper.accountId = String(account?.id || '');

  if (payload.invoice?.receiver) {
    orderMapper.customer = {
      firstName: payload.invoice?.name.split(' ').slice(0, -1).join(' ') || '',
      lastName: payload.invoice?.name.split(' ').slice(-1).join(' ') || '',
      fullName: payload.invoice?.name || '',
      document: payload.invoice?.document || '',
      documentType: payload.invoice?.documentType || '',
      address: {
        city: payload?.invoice?.receiver?.city || '',
        state: payload?.invoice?.receiver?.state || '',
        zipcode: payload?.invoice?.receiver?.zipCode || '',
        neighborhood: payload?.invoice?.receiver?.country || '',
      },
    };
  } else if (payload.customer) {
    orderMapper.customer = {
      firstName: payload.customer?.firstName,
      lastName: payload.customer?.lastName,
      fullName: payload.customer?.fullName || '',
      document: payload.customer?.document || '',
      documentType: payload.customer?.documentType || '',
      address: {
        city: payload?.delivery?.city || '',
        state: payload?.delivery?.state || '',
        zipcode: payload?.delivery?.zipCode || '',
        neighborhood: payload?.delivery?.neighborhood || '',
      },
    };
  }

  orderMapper.location = {
    id: account.id,
    name: account.name,
    document: account.document,
    address: {
      city: account.address?.city,
      state: account.address?.state,
      zipcode: account.address?.zipcode,
      neighborhood: account.address?.neighborhood,
    },
  };

  if (payload?.invoice?.packages.length) {
    orderMapper.packages = payload?.invoice?.packages?.map(item => {
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

  orderMapper.shippingEstimateDate =
    payload.estimateDeliveryDateDeliveryCompany;

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
