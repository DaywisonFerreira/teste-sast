import { OrderMapper } from '../../mappers/orderMapper';
import { ordersEntityMock } from './orders-entity.mock';

export const ordersUpdateMock = {
  data: {
    history: {
      shipment_order_volume_id: 230713,
      shipment_order_volume_state: 'IN_TRANSIT',
      tracking_state: null,
      created: 1467412580614,
      created_iso: '2022-05-02T17:37:55.225+00:00',
      provider_message: 'em processo de entrega',
      provider_state: 'ABC123',
      shipper_provider_state: 'ENT',
      esprinter_message: 'OBJETO EM RUA',
      shipment_volume_micro_state: {
        id: 4,
        code: '27',
        default_name: 'ENTREGUE',
        i18n_name: null,
        description: 'A carga foi entregue ao destinatário.',
        shipment_order_volume_state_id: 14,
        shipment_volume_state_source_id: 2,
        name: 'ENTREGUE',
      },
      attachments: [
        {
          file_name: 'assinatura.jpg',
          mime_type: 'image/jpg',
          type: 'POD',
          processing_status: 'PROCESSING',
          additional_information: {
            key1: 'value 1',
            key2: 'value 2',
          },
          url: 'https://s3-storage.intelipost.com.br/17359/file_attachment/b681a175-b701-4174-97d4-e9e1a6f3893e/comprovante.jpg',
          created: 1516031018137,
          created_iso: '2018-01-15T13:43:38.137-02:00',
          modified: 1516031018137,
          modified_iso: '2018-01-15T13:43:38.137-02:00',
        },
      ],
      shipment_order_volume_state_localized: 'Em trânsito',
      shipment_order_volume_state_history: 1384656,
      event_date: 1467404520000,
      event_date_iso: '2022-06-02T16:17:00.000+00:00',
    },
    invoice: {
      invoice_series: '4',
      invoice_number: '4027',
      invoice_key: '35211219112842112363550270010100661156064027',
    },
    order_number: 'SAP12345674027',
    sales_order_number: 'PE41234567-027',
    tracking_code: 'SAP1234567402540251',
    volume_number: '1',
    estimated_delivery_date: {
      client: {
        current: 1516031018137,
        current_iso: '2022-05-06T18:00:00.000+00:00',
        original: 1516031018137,
        original_iso: '2018-01-15T13:43:38.137-02:00',
      },
      logistic_provider: {
        current: 1516031018137,
        current_iso: '2018-01-15T13:43:38.137-02:00',
        original: 1516031018137,
        original_iso: '2018-01-15T13:43:38.137-02:00',
      },
    },
    tracking_url:
      'http://status.ondeestameupedido.com/tracking/6e00e79a612e696df729f1515bec2fc2648d1861',
  },
};

export const ordersUpdateMappedMock = {
  ...OrderMapper.mapPartnerToOrder(ordersUpdateMock.data),
  attachments: ordersUpdateMock.data.history.attachments,
};

export const attachmentMock = {
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
};

export const ordersUpdatedMock = {
  ...ordersEntityMock,
};
