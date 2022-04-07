/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
interface IReceiverPhones {
  phone: string;
  type: string;
}

interface ILogisticInfo {
  logisticContract: string;
  deliveryCompany: string;
  shippingEstimateDate: string;
  deliveryChannel: string;
  sellingPrice: number;
}
export class CsvMapper {
  static mapOrderToCsv(csvData: unknown[]) {
    return csvData.map((data: any) => {
      const {
        receiverName,
        receiverEmail,
        deliveryCity,
        deliveryState,
        deliveryZipCode,
        orderUpdatedAt,
        deliveryDate,
        orderCreatedAt,
        paymentDate,
        dispatchDate,
        estimateDeliveryDateDeliveryCompany,
        partnerStatus,
        orderSale,
        order,
        receiverPhones,
        logisticInfo,
        billingData,
        partnerMessage,
        numberVolumes,
        originZipCode,
        square,
        physicalWeight,
        lastOccurrenceMacro,
        lastOccurrenceMicro,
        lastOccurrenceMessage,
        quantityOccurrences,
      } = data;

      const statusMapper = {
        'created': 'Pedido criado',
        'operational-problem': 'Problema operacional',
        'carrier-possession': 'Em posse da transportadora',
        'first-delivery-failed': 'Insucesso na primeira tentativa de entrega',
        'address-error': 'Erro no endereço',
        'shippment-loss': 'Extravio',
        'hub-transfer': 'Em transferência entre hubs',
        'delivery-route': 'Em rota de entrega',
        'shippment-returned': 'Devolvido',
        'zip-code-not-serviced': 'CEP não atendido pela transportadora',
        'customer-refused': 'Cliente recusou a carga',
        'address-not-found': 'Endereço não encontrado',
        'away-customer': 'Cliente ausente',
        'shippment-stolen': 'Roubo',
        'tax-stop': 'Parada no posto fiscal',
        'dispatched': 'Despachado',
        'shippment-returning': 'Em devolução',
        'delivered-success': 'EntregueTesteTestado',
        'waiting-post-office-pickup': 'Aguardando retirada na agência dos Correios',
        'damage': 'Avaria',
        'unknown-customer': 'Cliente desconhecido',
        'invoiced': 'Faturado',
      }

      const statusCode =  statusMapper[data.statusCode.micro]


      return {
        'Nome do Destinatário': receiverName,
        'Cidade do Destinatário': deliveryCity,
        UF: deliveryState,
        'CEP do destinatário': deliveryZipCode,
        'Pedido de Venda': orderSale,
        Pedido: order,
        'Código de rastreio': billingData
          .map(
            ({ trackingNumber }: { trackingNumber: string }) => trackingNumber,
          )
          .join(', '),
        'Serie Nota': billingData
          .map(
            ({ invoiceSerialNumber }: { invoiceSerialNumber: string }) =>
              invoiceSerialNumber,
          )
          .join(', '),
        'Nota Fiscal': billingData
          .map(({ invoiceNumber }: { invoiceNumber: string }) => invoiceNumber)
          .join(', '),
        'Método de envio': billingData
          .map(({ carrierName }: { carrierName: string }) => carrierName)
          .join(', '),
        Transportadora: logisticInfo && logisticInfo[0].deliveryCompany,
        'Data Despacho': dispatchDate,
        'Status Transportador': statusCode,
        'Data do último status': orderUpdatedAt,
        'Data Entrega': deliveryDate,
        'Previsão Entrega Cliente':
          logisticInfo && logisticInfo[0].shippingEstimateDate,
        'Previsão Entrega Transp.': estimateDeliveryDateDeliveryCompany,
        'Mensagem Intelipost': partnerMessage,
        'Preço Frete': logisticInfo.reduce(
          (price: number, { sellingPrice }: ILogisticInfo) => {
            return (price += sellingPrice);
          },
          0,
        ),
        'No Volumes': numberVolumes,
        'Data Criação Pedido': orderCreatedAt,
        MicroStatus: partnerStatus,
        'Pagina Rastreamento': billingData
          .map(({ trackingUrl }: { trackingUrl: string }) => trackingUrl)
          .join(', '),
        'CEP origem': originZipCode,
        'Valor da Nota': billingData
          .map(({ invoiceValue }: { invoiceValue: string }) => invoiceValue)
          .join(', '),
        Praça: square,
        'Tipo de Entrega': logisticInfo && logisticInfo[0].logisticContract,
        'Peso fisico': physicalWeight,
        'e-mail Destinatário': receiverEmail,
        'Celular Destinatário': receiverPhones.reduce(
          (tels: string, { phone, type }: IReceiverPhones) => {
            return (tels += `${type}:${phone} `);
          },
          '',
        ),
        'Chave da Nota': billingData
          .map(({ invoiceKey }: { invoiceKey: string }) => invoiceKey)
          .join(', '),
        'Última Ocorrência (Macro)': lastOccurrenceMacro,
        'Última Ocorrência (Micro)': lastOccurrenceMicro,
        'Última Ocorrência (Mensagem)': lastOccurrenceMessage,
        'Quantidade de Ocorrências': quantityOccurrences,
        'Data_Hora Pagamento': paymentDate,
      };
    });
  }
}
