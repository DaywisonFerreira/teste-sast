import { Order } from '../interfaces/Order';
export class OrderMapper {
//     "storeCode": "IFC",
//    "storeId":  "5bd10dd619c52b0027ad29a5",
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
            storeCode,
            storeId,
            sellerCode,
            sellerId,
        } = payload;
        const { date: paymentDate } = history.find(
            ({ status }) => status === 'approved-in-origin'
        );
        const { date: deliveryDate } = history.find(
            ({ status }) => status === 'delivered'
        );

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
