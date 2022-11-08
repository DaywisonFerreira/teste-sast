/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
interface IReceiverPhones {
  phone: string;
  type: string;
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
        history,
        totals,
      } = data;

      // DO NOT CHANGE THE ORDER
      const statusMapper = {
        created: 'Criado',
        dispatched: 'Despachado',
        'waiting-for-collection': 'Aguardando coleta',
        'hub-transfer': 'Em processo de entrega (hub-transfer)',
        'carrier-possession': 'Em processo de entrega (carrier-possession)',
        'delivery-route': 'Em rota de entrega',
        'operational-problem': 'Problema operacional',
        'address-error': 'Endereço Insuficiente (address-error)',
        'shippment-loss': 'Extravio',
        'shippment-returned': 'Devolvido',
        'zip-code-not-serviced': 'Problema operacional (zip-code-not-serviced)',
        'customer-refused': 'Recusado pelo destinatario',
        'address-not-found': 'Endereço Insuficiente (address-not-found)',
        'away-customer': 'Destinatário Ausente',
        'shippment-stolen': 'Roubo',
        'tax-stop': 'Parada no posto fiscal',
        'shippment-returning': 'Em devolução',
        'waiting-post-office-pickup':
          'Aguardando retirada na agência dos Correios',
        damage: 'Avaria',
        'unknown-customer': 'Destinatário desconhecido',
        'first-delivery-failed': 'Problema operacional (first-delivery-failed)',
        'delivered-success': 'Entregue',
      };

      let statusCode = '';

      if (data.statusCode?.micro && statusMapper[data.statusCode.micro]) {
        statusCode = statusMapper[data.statusCode.micro];
      } else if (
        data.statusCode?.micro &&
        !statusMapper[data.statusCode.micro]
      ) {
        statusCode = data.statusCode.micro;
      }

      const histories = Object.keys(statusMapper).reduce((acc, status) => {
        const matchHistory = history?.find(h => h.statusCode?.micro === status);
        return {
          ...acc,
          [statusMapper[status]]:
            matchHistory && matchHistory.orderUpdatedAt
              ? matchHistory.orderUpdatedAt?.toISOString()
              : '',
        };
      }, {});

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
        'Data Despacho': dispatchDate ? dispatchDate?.toISOString() : '',
        'Status Transportador': statusCode,
        'Data do último status': orderUpdatedAt
          ? orderUpdatedAt?.toISOString()
          : '',
        'Data Entrega': deliveryDate ? deliveryDate?.toISOString() : '',
        'Previsão Entrega Cliente':
          logisticInfo && logisticInfo[0].shippingEstimateDate,
        'Previsão Entrega Transp.': estimateDeliveryDateDeliveryCompany
          ? estimateDeliveryDateDeliveryCompany?.toISOString()
          : '',
        'Mensagem Intelipost': partnerMessage,
        'Preço Frete': totals.find(total => total?.id === 'Shipping')?.value,
        'No Volumes': numberVolumes,
        'Data Criação Pedido': orderCreatedAt
          ? orderCreatedAt?.toISOString()
          : '',
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
        'Data_Hora Pagamento': paymentDate ? paymentDate?.toISOString() : '',
        ...histories,
      };
    });
  }
}
