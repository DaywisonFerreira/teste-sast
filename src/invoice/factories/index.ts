import { v4 as uuidV4 } from 'uuid';

export const MessageOrderCreated = content => {
  const { data, accountId, headers } = content;
  const { id } = data;
  const { deliveryModeName, externalDeliveryMethodId } = data.carrier;

  delete data.carrier.externalDeliveryMethodId;
  delete data.carrier.deliveryModeName;
  delete data.carrier.id;

  return {
    headers: {
      'X-Correlation-Id':
        headers['X-Correlation-Id'] || headers['x-correlation-id'] || uuidV4(),
      'X-Version': '1.0',
      'X-Tenant-Id': accountId,
    },
    key: { accountId, id },
    value: JSON.stringify({
      data: {
        id: data.id,
        notfisFile: data.notfisFile,
        notfisFileName: data.notfisFileName,
        number: data.number,
        serie: data.serie,
        key: data.key,
        protocol: data.protocol,
        emissionDate: data.emissionDate,
        operationType: data.operationType,
        isOut: data.isOut,
        estimatedDeliveryDate: data.estimatedDeliveryDate,
        additionalInfo: data.additionalInfo ?? {},
        order: data.order,
        deliveryMode: {
          name: deliveryModeName,
          id: externalDeliveryMethodId,
        },
        packages: data.packages,
        total: data.total,
        carrier: data.carrier,
        emitter: data.emitter,
        receiver: data.receiver,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    }),
  };
};
