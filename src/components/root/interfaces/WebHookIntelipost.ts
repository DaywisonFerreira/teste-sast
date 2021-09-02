interface Iinvoice {
    invoice_series: string;
    invoice_number: string;
    invoice_key: string;
}

interface Ishipment_volume_micro_state {
    id: number;
    code: string;
    default_name: string;
    i18n_name: string;
    description: string;
    shipment_order_volume_state_id: number;
    shipment_volume_state_source_id: number;
    name: string;
}

interface Iattachments {
    file_name: string;
    mime_type: string;
    type: string;
    processing_status: string;
    additional_information: {
        key1: string;
        key2: string;
    };
    url: string;
    created: number;
    created_iso: string;
    modified: number;
    modified_iso: string;
}

interface Ihistory {
    shipment_order_volume_id: number;
    shipment_order_volume_state: string;
    tracking_state: string;
    created: number;
    created_iso: string;
    provider_message: string;
    provider_state: string;
    shipper_provider_state: string;
    esprinter_message: string;
    shipment_volume_micro_state: Ishipment_volume_micro_state;
    attachments: Iattachments[];
    shipment_order_volume_state_localized: string;
    shipment_order_volume_state_history: number;
    event_date: number;
    event_date_iso: string;
}

interface Iclient {
    current: number;
    current_iso: string;
    original: number;
    original_iso: string;
}
interface Ilogistic_provider {
    current: number;
    current_iso: string;
    original: number;
    original_iso: string;
}

interface Iestimated_delivery_date {
    client: Iclient;
    logistic_provider: Ilogistic_provider;
}

export default interface IWebHookIntelepost {
    history: Ihistory;
    invoice: Iinvoice;
    order_number: string;
    sales_order_number: string;
    tracking_code: string;
    volume_number: string;
    estimated_delivery_date: Iestimated_delivery_date;
    tracking_url: string;
}

// example payload
// https://docs.intelipost.com.br/v1/pedido-de-entrega/recebimento-de-status-webhook
// {
//     "history": {
//       "shipment_order_volume_id": 230713,
//       "shipment_order_volume_state": "IN_TRANSIT",
//       "tracking_state": null,
//       "created": 1467412580614,
//       "created_iso": "2016-07-01T19:36:20.614-03:00",
//       "provider_message": "em processo de entrega",
//       "provider_state": "ABC123",
//       "shipper_provider_state": "ENT",
//       "esprinter_message": "OBJETO EM RUA",
//       "shipment_volume_micro_state": {
//         "id": 28,
//         "code": "27",
//         "default_name": "CARGA REDESPACHADA",
//         "i18n_name": null,
//         "description": "A carga foi entregue para uma outra transportadora para contiunar a entrega até o destino. ",
//         "shipment_order_volume_state_id": 12,
//         "shipment_volume_state_source_id": 2,
//         "name": "CARGA REDESPACHADA"
//       },
//       "attachments": [
//         {
//           "file_name": "assinatura.jpg",
//           "mime_type": "image/jpg",
//           "type": "OTHER",
//           "processing_status": "PROCESSING",
//           "additional_information": {
//             "key1": "value 1",
//             "key2": "value 2"
//           },
//           "url": null,
//           "created": 1516031018137,
//           "created_iso": "2018-01-15T13:43:38.137-02:00",
//           "modified": 1516031018137,
//           "modified_iso": "2018-01-15T13:43:38.137-02:00"
//         }
//       ],
//       "shipment_order_volume_state_localized": "Em trânsito",
//       "shipment_order_volume_state_history": 1384656,
//       "event_date": 1467404520000,
//       "event_date_iso": "2016-07-01T17:22:00.000-03:00"
//     },
//     "invoice": {
//       "invoice_series": "1",
//       "invoice_number": "1000",
//       "invoice_key": "00000502834982004563550010000084111000132317"
//     },
//     "order_number": "PEDIDO0004",
//     "sales_order_number": "PEDIDODEVENDA01",
//     "tracking_code": "IP20160701BR",
//     "volume_number": "1",
//     "estimated_delivery_date": {
//       "client": {
//         "current": 1516031018137,
//         "current_iso": "2018-01-15T13:43:38.137-02:00",
//         "original": 1516031018137,
//         "original_iso": "2018-01-15T13:43:38.137-02:00"
//       },
//       "logistic_provider": {
//         "current": 1516031018137,
//         "current_iso": "2018-01-15T13:43:38.137-02:00",
//         "original": 1516031018137,
//         "original_iso": "2018-01-15T13:43:38.137-02:00"
//       }
//     },
//     "tracking_url": "http://status.ondeestameupedido.com/tracking/d3735d1786ca1d8cb4609f6f1f89b604e3ac2f96"
//   }
