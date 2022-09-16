import { LeanDocument } from 'mongoose';

import { OrderEntity } from '../../schemas/order.schema';

export const ordersEntityMock: LeanDocument<OrderEntity> & {
  createdAt: Date;
  updatedAt: Date;
} = {
  _id: '632386116f8ff8001962f866',
  orderSale: 'TST-1261870112646-02',
  partnerOrder: 'WEB-728948442',
  orderUpdatedAt: new Date('2022-09-15T21:39:00.000+00:00'),
  invoiceKeys: ['31220915427207003094650010000009221051951564'],
  invoice: {
    key: '31220915427207003094650010000009221051951564',
    serie: '1',
    number: '922',
    trackingUrl:
      'http://status.ondeestameupedido.com/tracking/9153a4be170ac17eeff212384b9b113536d62726',
    trackingNumber: 'WEB-7289484429221',
    value: 59.96,
    issuanceDate: new Date('2022-09-15T19:45:00.001Z'), // no BD é salvo como string
    carrierName: 'LS TRANSLOG LOGISTICA E SERVICOS DE TRANSPORTE LTDA-ME',
    items: [
      {
        sku: '4072700001188',
        quantity: 2,
        price: 14.99,
        isSubsidized: false,
      },
      {
        sku: '4072700004417',
        quantity: 2,
        price: 14.99,
        isSubsidized: false,
      },
    ],
    customerDocument: '99908888691',
    deliveryMethod: 'Emporio Local',
  },
  estimateDeliveryDateDeliveryCompany: new Date(
    '2022-09-20T02:59:00.000+00:00',
  ),
  partnerMessage:
    'https://sistema.lstranslog.com.br/consulta/detalhesdopedido/30091333',
  partnerStatusId: '60',
  partnerMacroStatusId: '14',
  numberVolumes: 18701695,
  volumeNumber: 18701695,
  microStatus: 'ENTREGUE NO DESTINO',
  lastOccurrenceMacro: 'Entrega ao destinatário realizada com sucesso',
  lastOccurrenceMicro: 'ENTREGUE NO DESTINO',
  lastOccurrenceMessage: 'A carga foi entregue para o destinatário.',
  partnerStatus: 'delivered',
  i18n: 'DELIVERED_TO_DESTINATION_1',
  statusCode: {
    micro: 'delivered-success',
    macro: 'delivered',
  },
  attachments: [
    {
      fileName: 'assinatura.jpg',
      mimeType: 'image/jpg',
      type: 'POD',
      additionalInfo: {
        key1: 'value 1',
        key2: 'value 2',
      },
      url: 'https://s3-storage.intelipost.com.br/17359/file_attachment/b681a175-b701-4174-97d4-e9e1a6f3893e/comprovante.jpg',
      originalUrl:
        'https://s3-storage.intelipost.com.br/17359/file_attachment/b681a175-b701-4174-97d4-e9e1a6f3893e/comprovante.jpg',
      createdAt: '2018-01-15T13:43:38.137-02:00',
    },
  ],
  history: [
    {
      volumeNumber: 18701695,
      estimateDeliveryDateDeliveryCompany: new Date(
        '2022-09-20T02:59:00.000+00:00',
      ),
      partnerMessage: null,
      microStatus: 'CRIADO',
      lastOccurrenceMacro: null,
      lastOccurrenceMicro: 'CRIADO',
      lastOccurrenceMessage:
        'A entrega foi criada com sucesso. Aguarde os demais status de rastreamento.',
      partnerStatusId: '67',
      partnerStatus: 'new',
      statusCode: {
        micro: 'created',
        macro: 'order-created',
      },
      orderUpdatedAt: new Date('2022-09-15T19:45:00.000+00:00'),
      i18n: 'CREATED',
    },
    {
      volumeNumber: 18701695,
      dispatchDate: new Date('2022-09-15T20:07:01.000+00:00'),
      estimateDeliveryDateDeliveryCompany: new Date(
        '2022-09-20T02:59:00.000+00:00',
      ),
      partnerMessage: null,
      microStatus: 'DESPACHADO',
      lastOccurrenceMacro: null,
      lastOccurrenceMicro: 'DESPACHADO',
      lastOccurrenceMessage:
        'A entrega foi despachada do Centro de Distribuição. Aguarde os demais status de rastreamento.',
      partnerStatusId: '69',
      partnerStatus: 'shipped',
      statusCode: {
        micro: 'dispatched',
        macro: 'order-dispatched',
      },
      orderUpdatedAt: new Date('2022-09-15T20:07:01.000+00:00'),
      i18n: 'SHIPPED',
    },
    {
      volumeNumber: 18701695,
      dispatchDate: null,
      estimateDeliveryDateDeliveryCompany: new Date(
        '2022-09-20T02:59:00.000+00:00',
      ),
      partnerMessage:
        'https://sistema.lstranslog.com.br/consulta/detalhesdopedido/30091333',
      microStatus: 'EM TRÂNSITO',
      lastOccurrenceMacro: 'Carga está em trânsito.',
      lastOccurrenceMicro: 'EM TRÂNSITO',
      lastOccurrenceMessage: 'Carga está em trânsito.',
      partnerStatusId: '3',
      partnerStatus: 'in-transit',
      statusCode: {
        micro: 'hub-transfer',
        macro: 'in-transit',
      },
      orderUpdatedAt: new Date('2022-09-15T20:05:00.000+00:00'),
      i18n: 'IN_TRANSIT',
    },
    {
      volumeNumber: 18701695,
      dispatchDate: null,
      estimateDeliveryDateDeliveryCompany: new Date(
        '2022-09-20T02:59:00.000+00:00',
      ),
      partnerMessage:
        'https://sistema.lstranslog.com.br/consulta/detalhesdopedido/30091333',
      microStatus: 'ENTREGUE NO DESTINO',
      lastOccurrenceMacro: 'Entrega ao destinatário realizada com sucesso',
      lastOccurrenceMicro: 'ENTREGUE NO DESTINO',
      lastOccurrenceMessage: 'A carga foi entregue para o destinatário.',
      partnerStatusId: '60',
      partnerStatus: 'delivered',
      statusCode: {
        micro: 'delivered-success',
        macro: 'delivered',
      },
      orderUpdatedAt: new Date('2022-09-15T22:12:47.834+00:00'),
      i18n: 'DELIVERED_TO_DESTINATION_1',
    },
  ],
  createdAt: new Date('2022-09-15T20:07:45.275+00:00'),
  updatedAt: new Date('2022-09-15T22:12:47.834+00:00'),
  __v: 0,
  dispatchDate: new Date('2022-09-15T20:07:01.000+00:00'),
  status: 'delivered',
  billingData: [
    {
      pickupInfo: {
        isReady: false,
      },
      _id: '632386baae150e002a281c1c',
      customerDocument: '99908888691',
      invoiceNumber: '922',
      invoiceSerialNumber: '001',
      invoiceValue: 59.96,
      issuanceDate: new Date('2022-09-15T19:45:00.001Z'), // no BD é salvo como string
      invoiceKey: '31220915427207003094650010000009221051951564',
      items: [
        {
          sku: '4072700001188',
          quantity: 2,
          price: 14.99,
          isSubsidized: false,
        },
        {
          sku: '4072700004417',
          quantity: 2,
          price: 14.99,
          isSubsidized: false,
        },
      ],
      carrierName: 'LS TRANSLOG LOGISTICA E SERVICOS DE TRANSPORTE LTDA-ME',
      trackingNumber: 'WEB-7289484429221',
      trackingUrl:
        'https://status.ondeestameupedido.com/tracking/17359/WEB-728948442',
      events: [],
    },
  ],
  customer: {
    phones: [
      {
        phone: '+5547992214387',
        type: 'residential',
      },
    ],
    email: 'dfae364c87ea40988457c0081507da2c@ct.vtex.com.br',
    isCorporate: false,
    firstName: 'João',
    lastName: 'da Silva',
    document: '99908888691',
    documentType: 'cpf',
    corporateName: null,
    fullName: 'João da Silva',
  },
  delivery: {
    receiverName: 'João da Silva',
    city: 'Botas',
    state: 'PA',
    zipCode: '30834-788',
    country: 'BRA',
  },
  deliveryCity: 'Botas',
  deliveryDate: new Date('2022-09-15T21:39:00.000+00:00'),
  deliveryState: 'MG',
  deliveryZipCode: '30320-380',
  internalOrderId: '728948960',
  logisticInfo: [
    {
      pickupStoreInfo: {
        additionalInfo: null,
        dockId: null,
        friendlyName: null,
        isPickupStore: false,
      },
      shipsTo: null,
      _id: '632376abae150e002a928325',
      itemIndex: 0,
      logisticContract: 'Emporio Local',
      lockTTL: '12d',
      price: 0,
      listPrice: 4.45,
      sellingPrice: 0,
      deliveryWindow: null,
      deliveryCompany: 'LS D1 - BOTAS',
      shippingEstimate: '2bd',
      shippingEstimateDate: new Date('2022-09-19T19:07:54.184Z'), // no BD é salvo como string
      deliveryIds: [
        {
          _id: '632376abae150f992a262926',
          courierId: '10993b9',
          courierName: 'LS D1 - BOTAS',
          dockId: 'darkstore-botas',
          quantity: 2,
          warehouseId: 'darkstore-botas',
        },
      ],
      deliveryChannel: 'delivery',
    },
    {
      pickupStoreInfo: {
        additionalInfo: null,
        dockId: null,
        friendlyName: null,
        isPickupStore: false,
      },
      shipsTo: null,
      _id: '632376abae1098002a262927',
      itemIndex: 1,
      logisticContract: 'Emporio Local',
      lockTTL: '12d',
      price: 0,
      listPrice: 4.45,
      sellingPrice: 0,
      deliveryWindow: null,
      deliveryCompany: 'LS D1 - BOTAS',
      shippingEstimate: '2bd',
      shippingEstimateDate: new Date('2022-09-19T19:07:54.184Z'), // no BD é salvo como string
      deliveryIds: [
        {
          _id: '632376ab98750e002a262928',
          courierId: '11233b9',
          courierName: 'LS D1 - BOTAS',
          dockId: 'darkstore-botas',
          quantity: 2,
          warehouseId: 'darkstore-botas',
        },
      ],
      deliveryChannel: 'delivery',
    },
  ],
  order: 'WEB-728948442',
  orderCreatedAt: new Date('2022-09-15T19:01:53.050+00:00'),
  orderId: '632376aba8900e002a262924',
  paymentDate: new Date('2022-09-15T19:38:28.458+00:00'),
  receiverEmail: 'dfae364c87ea40988457c0081507da2c@ct.vtex.com.br',
  receiverName: 'João da Silva',
  receiverPhones: [
    {
      phone: '+5547992214387',
      type: 'residential',
    },
  ],
  salesChannel: 'SLR',
  sellerCode: 'darkstore-botas',
  sellerId: '617c0187760125002ab33837',
  storeCode: 'STORE',
  storeId: '617c0034876900002773c508',
  totalShippingPrice: 0,
  totals: [
    {
      id: 'Items',
      name: 'Total dos Itens',
      value: 79.96,
    },
    {
      id: 'Discounts',
      name: 'Total dos Descontos',
      value: -20,
    },
    {
      id: 'Shipping',
      name: 'Total do Frete',
      value: 0,
    },
    {
      id: 'Tax',
      name: 'Total da Taxa',
      value: 0,
    },
  ],
  value: 59.96,
};
