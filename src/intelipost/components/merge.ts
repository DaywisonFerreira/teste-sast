import { Model } from 'mongoose';
import { OrderDocument } from '../../order/schemas/order.schema';

export async function merge(
  OrderModel: Model<OrderDocument>,
  configPK: any,
  data: any = {},
  options: any = { runValidators: true, useFindAndModify: false },
) {
  const response = await OrderModel.findOne(configPK);
  if (!response) {
    await OrderModel.create(data);
  } else {
    await OrderModel.findOneAndUpdate(
      configPK,
      {
        $push: {
          history: {
            dispatchDate: data.dispatchDate,
            estimateDeliveryDateDeliveryCompany:
              data.estimateDeliveryDateDeliveryCompany,
            partnerMessage: data.partnerMessage,
            numberVolumes: data.numberVolumes,
            microStatus: data.microStatus,
            lastOccurrenceMacro: data.lastOccurrenceMacro,
            lastOccurrenceMicro: data.lastOccurrenceMicro,
            lastOccurrenceMessage: data.lastOccurrenceMessage,
            partnerStatus: data.partnerStatus,
            partnerUpdatedAt: data.partnerUpdatedAt,
            i18n: data.i18n,
          },
        },
      },
      options,
    );
  }
}
