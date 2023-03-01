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
        estimateDeliveryDate,
        partnerStatus,
        orderSale,
        order,
        receiverPhones,
        invoice,
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
        'waiting-for-collection': 'Aguardando despacho',
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

      let estimateDeliveryDateClient = '';

      if (estimateDeliveryDate && estimateDeliveryDate instanceof Date) {
        estimateDeliveryDateClient = estimateDeliveryDate.toISOString();
      } else if (
        estimateDeliveryDateDeliveryCompany &&
        estimateDeliveryDateDeliveryCompany instanceof Date
      ) {
        estimateDeliveryDateClient =
          estimateDeliveryDateDeliveryCompany.toISOString();
      }

      const histories = Object.keys(statusMapper).reduce((acc, status) => {
        const matchHistory = history?.find(h => h.statusCode?.micro === status);
        return {
          ...acc,
          [statusMapper[status]]:
            matchHistory &&
              matchHistory.orderUpdatedAt &&
              matchHistory.orderUpdatedAt instanceof Date
              ? matchHistory?.orderUpdatedAt?.toISOString()
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
        'Código de rastreio': invoice.trackingNumber,
        'Serie Nota': invoice.serie,
        'Nota Fiscal': invoice.number,
        'Método de envio': invoice.carrierName,
        Transportadora: invoice.deliveryCompany
          ? invoice.deliveryCompany
          : invoice.carrierName,
        'Data Despacho':
          dispatchDate && dispatchDate instanceof Date
            ? dispatchDate?.toISOString()
            : '',
        'Status Transportador': statusCode,
        'Data do último status':
          orderUpdatedAt && orderUpdatedAt instanceof Date
            ? orderUpdatedAt?.toISOString()
            : '',
        'Data Entrega':
          deliveryDate && deliveryDate instanceof Date
            ? deliveryDate?.toISOString()
            : '',
        'Previsão Entrega Cliente': estimateDeliveryDateClient,
        'Previsão Entrega Transp.':
          estimateDeliveryDateDeliveryCompany &&
            estimateDeliveryDateDeliveryCompany instanceof Date
            ? estimateDeliveryDateDeliveryCompany.toISOString()
            : '',
        'Mensagem Intelipost': partnerMessage,
        'Preço Frete': totals
          ?.find(total => total?.id === 'Shipping')
          ?.value?.toLocaleString('pt-br', {
            style: 'currency',
            currency: 'BRL',
          }),
        'No Volumes': numberVolumes,
        'Data Criação Pedido':
          orderCreatedAt && orderCreatedAt instanceof Date
            ? orderCreatedAt?.toISOString()
            : '',
        MicroStatus: partnerStatus,
        'Pagina Rastreamento': invoice.trackingUrl,
        'CEP origem': originZipCode,
        'Valor da Nota': invoice?.value?.toLocaleString('pt-br', {
          style: 'currency',
          currency: 'BRL',
        }),
        Praça: square,
        'Tipo de Entrega': invoice?.deliveryMethod
          ? invoice?.deliveryMethod
          : '',
        'Peso fisico': physicalWeight,
        'e-mail Destinatário': receiverEmail,
        'Celular Destinatário': receiverPhones?.reduce(
          (tels: string, { phone, type }: IReceiverPhones) => {
            return (tels += `${type}:${phone} `);
          },
          '',
        ),
        'Chave da Nota': invoice.key,
        'Última Ocorrência (Macro)': lastOccurrenceMacro,
        'Última Ocorrência (Micro)': lastOccurrenceMicro,
        'Última Ocorrência (Mensagem)': lastOccurrenceMessage,
        'Quantidade de Ocorrências': quantityOccurrences,
        'Data_Hora Pagamento':
          paymentDate && paymentDate instanceof Date
            ? paymentDate?.toISOString()
            : '',
        ...histories,
      };
    });
  }
}
