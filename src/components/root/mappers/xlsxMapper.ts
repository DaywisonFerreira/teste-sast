interface IReceiverPhones{
    phone: string,
    type: string
}

export class XlsxMapper{
    static mapOrderToXlsx(xlsxData: unknown[]){
        return xlsxData.map((data:any) => {
            const {
                receiverName, receiverEmail, deliveryCity, deliveryState,
                deliveryZipCode, orderUpdatedAt, deliveryDate, orderCreatedAt,
                paymentDate, dispatchDate, estimateDeliveryDateDeliveryCompany,
                statusIHUB, statusIntelipost, orderId, orderSale, order, receiverPhones,
                logisticInfo, billingData, internalOrderId
            } = data

            return {
                "PEDIDO_ID": String(orderId),
                "PEDIDO_VENDA": orderSale,
                "PEDIDO_INTERNO": internalOrderId,
                "PEDIDO": order,
                "NOME_DESTINATARIO": receiverName,
                "EMAIL_DESTINATARIO": receiverEmail,
                "TELEFONE_DESTINATARIO": receiverPhones.reduce((tels: string, {phone, type}: IReceiverPhones) => {
                    return tels += `${type}:${phone}/`
                  }, ''),
                "CIDADE_DESTINATARIO": deliveryCity,
                "ESTADO_DESTINATARIO": deliveryState,
                "CEP_DESTINATARIO": deliveryZipCode,
                "ULTIMA_ATUALIZACAO": orderUpdatedAt,
                "DATA_ESTIMADA_ENTREGA": estimateDeliveryDateDeliveryCompany,
                "CRIACAO_PEDIDO": orderCreatedAt,
                "DATA_PAGAMENTO": paymentDate,
                "DATA_DESPACHO": dispatchDate,
                "DATA_ENTREGA": deliveryDate,
                "STATUS_IHUB": statusIHUB,
                "STATUS_INTELIPOST": statusIntelipost,
                "DETALHES_LOGISTICA": JSON.stringify(logisticInfo),
                "DETALHES_FATURAMENTO": JSON.stringify(billingData)
            }
        })
    }
}
