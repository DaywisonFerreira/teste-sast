import { Order } from '../interfaces/Order';

export class OrderMapper {

    private static parseFloat(value: any): number {
        if (!value) {
            return 0;
        }
        return Number.parseFloat(value && value.$numberDecimal ? value.$numberDecimal : value);
    }

    static mapMessageToOrder(payload: Order) {
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
        let paymentDate, deliveryDate

        const historyApproved = history.find(
            ({ status }) => status === 'approved-in-origin'
        );
        if (historyApproved) {
            paymentDate = historyApproved.date
        }

        const historyDelivered = history.find(
            ({ status }) => status === 'delivered'
        );
        if (historyDelivered) {
            deliveryDate = historyDelivered.date
        }

        const logisticInfo = Array.isArray(logisticInfoRaw)
            ? logisticInfoRaw.map(l => ({
                ...l,
                price: this.parseFloat(l.price),
                listPrice: this.parseFloat(l.listPrice),
                sellingPrice: this.parseFloat(l.sellingPrice),
            }))
            : []

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
                            price: this.parseFloat(i.price)
                        }))
                        : []
                }))
                : [],
            logisticInfo,
            status,
            totalShippingPrice: logisticInfo.length
                ? logisticInfo.reduce(
                    (t, { sellingPrice }) => t + sellingPrice,
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
            partnerUpdatedAt: '',
        };
    }
}
