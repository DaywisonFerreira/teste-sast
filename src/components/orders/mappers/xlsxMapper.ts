interface IReceiverPhones{
    phone: string,
    type: string
}

interface IBillingData {
    trackingNumber: string,
    invoiceSerialNumber:string,
    invoiceValue:number,
    invoiceNumber:string,
    issuanceDate:string,
    invoiceKey:string,
    carrierName:string,
    trackingUrl:string
}

interface ILogisticInfo {
    logisticContract:string,
    deliveryCompany:string,
    shippingEstimateDate:string,
    deliveryChannel:string,
    sellingPrice: number
}
export class XlsxMapper{
    static mapOrderToXlsx(xlsxData: unknown[]){
        return xlsxData.map((data:any) => {
            const {
                receiverName, receiverEmail, deliveryCity, deliveryState,
                deliveryZipCode, orderUpdatedAt, deliveryDate, orderCreatedAt,
                paymentDate, dispatchDate, estimateDeliveryDateDeliveryCompany,
                status, partnerStatus, orderSale, order, receiverPhones,
                logisticInfo, billingData, partnerUpdatedAt, partnerMessage,
                numberVolumes, originZipCode, square, physicalWeight, lastOccurrenceMacro, lastOccurrenceMicro,
                lastOccurrenceMessage, quantityOccurrences
            } = data

            return {
                "Nome do Destinatário": receiverName,
                "Cidade do Destinatário": deliveryCity,
                "UF": deliveryState,
                "CEP do destinatário": deliveryZipCode,
                "Pedido de Venda": orderSale,
                "Pedido": order,
                "Código de rastreio": billingData.reduce((code:string, {trackingNumber}: IBillingData)=>{
                    return code += `${trackingNumber} `
                }, ''),
                "Serie Nota": billingData.reduce((serialNumber: string, {invoiceSerialNumber}: IBillingData)=>{
                    return serialNumber += `${invoiceSerialNumber} `
                }, ''),
                "Nota Fiscal": billingData.reduce((nf: string, {invoiceNumber}: IBillingData)=>{
                    return nf += `${invoiceNumber} `
                }, ''),
                "Método de envio": billingData.reduce((method: string, {carrierName}: IBillingData)=>{
                    return method += `${carrierName} `
                }, ''),
                "Transportadora": logisticInfo.reduce((company: string, {deliveryCompany}: ILogisticInfo)=>{
                    return company += `${deliveryCompany} `
                }, ''),
                "Data Despacho": dispatchDate,
                "Status Transportador": status,
                "Data do último status": orderUpdatedAt,
                "Data Entrega": deliveryDate,
                "Atualizado em": partnerUpdatedAt,
                "Previsão Entrega Cliente": logisticInfo.reduce((date: string, {shippingEstimateDate}: ILogisticInfo)=>{
                    return date += `${shippingEstimateDate} `
                }, ''),
                "Previsão Entrega Transp.": estimateDeliveryDateDeliveryCompany,
                "Mensagem Intelipost": partnerMessage,
                "Preço Frete": logisticInfo.reduce((price: number, {sellingPrice}: ILogisticInfo)=>{
                    return price += sellingPrice
                }, 0),
                "No Volumes": numberVolumes,
                "Data Criação Pedido": orderCreatedAt,
                "MicroStatus": partnerStatus,
                "Pagina Rastreamento": billingData.reduce((url: string, {trackingUrl}: IBillingData)=>{
                    return url += `${trackingUrl} `
                }, ''),
                "CEP origem": originZipCode,
                "Valor da Nota": billingData.reduce((value: number, {invoiceValue}: IBillingData)=>{
                    return value += invoiceValue
                }, ''),
                "Praça": square,
                "Tipo de Entrega": logisticInfo.reduce((contract: string, {logisticContract}: ILogisticInfo)=>{
                    return contract += `${logisticContract} `
                }, ''),
                "Peso fisico": physicalWeight,
                "e-mail Destinatário": receiverEmail,
                "Celular Destinatário": receiverPhones.reduce((tels: string, {phone, type}: IReceiverPhones) => {
                    return tels += `${type}:${phone} `
                }, ''),
                "Chave da Nota": billingData.reduce((key: string, {invoiceKey}: IBillingData)=>{
                    return key += `${invoiceKey} `
                }, ''),
                "Última Ocorrência (Macro)": lastOccurrenceMacro,
                "Última Ocorrência (Micro)": lastOccurrenceMicro,
                "Última Ocorrência (Mensagem)": lastOccurrenceMessage,
                "Quantidade de Ocorrências": quantityOccurrences,
                "Data_Hora Pagamento": paymentDate
            }
        })
    }
}
