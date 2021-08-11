import { Order } from '../interfaces/Order';
export class OrderMapper {
    static mapMessageToOrder(payload: Order) {
        const {
            _id: orderId,
            deliveryAddress,
            erpInfo,
            externalOrderId,
            packageAttachment,
            logisticInfo,
            updatedAt,
            history,
            creationDate,
            customer,
            internalOrderId,
            status,
            affiliateId,
        } = payload;
        const { date: paymentDate } = history.find(
            ({ status }) => status === 'approved-in-origin'
        );
        const { date: deliveryDate } = history.find(
            ({ status }) => status === 'delivered'
        );

        return {
            orderId,
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
            billingData: packageAttachment.packages,
            logisticInfo: logisticInfo,
            status: status,
            totalShippingPrice: logisticInfo.length
                ? logisticInfo.reduce(
                      (t, { sellingPrice }) => t + Number(sellingPrice),
                      0
                  )
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
            partnerUpdatedAt:'',
        };
    }
}
