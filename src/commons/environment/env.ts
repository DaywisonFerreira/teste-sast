import * as dotenv from 'dotenv';

dotenv.config();

export abstract class Env {
  public static readonly NODE_ENV: string =
    process.env.NODE_ENV || 'development';

  public static readonly KAFKA_TOPIC_ACCOUNT_CREATED: string =
    process.env.KAFKA_TOPIC_ACCOUNT_CREATED;

  public static readonly KAFKA_TOPIC_ACCOUNT_CHANGED: string =
    process.env.KAFKA_TOPIC_ACCOUNT_CHANGED;

  public static readonly KAFKA_TOPIC_ACCOUNT_LOCATION_CREATED: string =
    process.env.KAFKA_TOPIC_ACCOUNT_LOCATION_CREATED;

  public static readonly KAFKA_TOPIC_ACCOUNT_LOCATION_CHANGED: string =
    process.env.KAFKA_TOPIC_ACCOUNT_LOCATION_CHANGED;

  public static readonly KAFKA_TOPIC_ACCOUNT_LOCATION_ASSOCIATED: string =
    process.env.KAFKA_TOPIC_ACCOUNT_LOCATION_ASSOCIATED;

  public static readonly KAFKA_TOPIC_ACCOUNT_LOCATION_UNASSOCIATED: string =
    process.env.KAFKA_TOPIC_ACCOUNT_LOCATION_UNASSOCIATED;

  public static readonly APPLICATION_PORT: string =
    process.env.APPLICATION_PORT;

  public static readonly APPLICATION_NAME: string =
    process.env.APPLICATION_NAME;

  public static readonly APPLICATION_VERSION: string =
    process.env.APPLICATION_VERSION;

  public static readonly CHUNK_SIZE_WRITE: number = parseInt(
    process.env.CHUNK_SIZE_WRITE,
    10,
  );

  public static readonly LIMIT_LINES_XLSX_FILE: number = parseInt(
    process.env.LIMIT_LINES_XLSX_FILE,
    10,
  );

  public static readonly TRACKING_CONNECTORS_ENABLES: string[] = process.env
    .TRACKING_CONNECTORS_ENABLES
    ? process.env.TRACKING_CONNECTORS_ENABLES.split(',')
    : [];

  public static readonly AZURE_ACCOUNT_NAME: string = String(
    process.env.AZURE_ACCOUNT_NAME,
  );

  public static readonly AZURE_ACCOUNT_KEY: string = String(
    process.env.AZURE_ACCOUNT_KEY,
  );

  public static readonly AZURE_BS_CONTAINER_NAME: string =
    process.env.AZURE_BS_CONTAINER_NAME;

  public static readonly AZURE_BS_STORAGE_URL: string =
    process.env.AZURE_BS_STORAGE_URL;

  public static readonly AZURE_BS_ACCESS_KEY: string =
    process.env.AZURE_BS_ACCESS_KEY;

  public static readonly SWAGGER_TITLE: string = process.env.SWAGGER_TITLE;

  public static readonly SWAGGER_DESCRIPTION: string =
    process.env.SWAGGER_DESCRIPTION;

  public static readonly SWAGGER_DOCS: string = process.env.SWAGGER_DOCS;

  public static readonly SWAGGER_SERVER: string = process.env.SWAGGER_SERVER;

  public static readonly DATABASE_URI: string = process.env.DATABASE_URI;

  public static readonly KAFKA_CLIENT_ID: string = process.env.KAFKA_CLIENT_ID;

  public static readonly KAFKA_URIS: string = process.env.KAFKA_URIS;

  public static readonly KAFKA_GROUP_ID: string = process.env.KAFKA_GROUP_ID;

  public static readonly KAFKA_TOPIC_FREIGHT_ORDERS_EXPORT: string =
    process.env.KAFKA_TOPIC_FREIGHT_ORDERS_EXPORT;

  public static readonly KAFKA_TOPIC_FREIGHT_ORDERS_EXPORT_NOTIFY: string =
    process.env.KAFKA_TOPIC_FREIGHT_ORDERS_EXPORT_NOTIFY;

  public static readonly KAFKA_TOPIC_CARRIER_CREATED: string =
    process.env.KAFKA_TOPIC_CARRIER_CREATED;

  public static readonly KAFKA_TOPIC_CARRIER_CHANGED: string =
    process.env.KAFKA_TOPIC_CARRIER_CHANGED;

  public static readonly KAFKA_TOPIC_INVOICE_CREATED: string =
    process.env.KAFKA_TOPIC_INVOICE_CREATED;

  public static readonly KAFKA_TOPIC_INVOICE_INTEGRATED: string =
    process.env.KAFKA_TOPIC_INVOICE_INTEGRATED;

  public static readonly PROCESS_CHUNK_SIZE_READ: string =
    process.env.PROCESS_CHUNK_SIZE_READ;

  public static readonly PROCESS_CHUNK_SIZE_NOTIFY: string =
    process.env.PROCESS_CHUNK_SIZE_NOTIFY;

  public static readonly INTELIPOST_USERNAME: string =
    process.env.INTELIPOST_USERNAME;

  public static readonly INTELIPOST_PASSWORD: string =
    process.env.INTELIPOST_PASSWORD;

  public static readonly INTELIPOST_TOTAL_RESEND: number =
    Number.parseInt(process.env.INTELIPOST_TOTAL_RESEND, 10) || 6;

  public static readonly INTELIPOST_SLEEP_RESEND: number = Number.parseInt(
    process.env.INTELIPOST_SLEEP_RESEND,
    10,
  );

  public static readonly RABBITMQ_URI: string = process.env.RABBITMQ_URI;

  public static readonly RABBITMQ_PREFETCH: number = Number.parseInt(
    process.env.RABBITMQ_PREFETCH,
    10,
  );

  public static readonly RABBITMQ_ORDER_NOTIFICATION_EXCHANGE: string =
    process.env.RABBITMQ_ORDER_NOTIFICATION_EXCHANGE;

  public static readonly INTELIPOST_SHIPMENT_ORDER_ENDPOINT: string =
    process.env.INTELIPOST_SHIPMENT_ORDER_ENDPOINT;

  public static readonly INTELIPOST_SHIPMENT_ORDER_APIKEY: string =
    process.env.INTELIPOST_SHIPMENT_ORDER_APIKEY;

  public static readonly INTELIPOST_SHIPMENT_ORDER_PLATFORM: string =
    process.env.INTELIPOST_SHIPMENT_ORDER_PLATFORM;

  public static readonly KAFKA_TOPIC_INTELIPOST_CREATED: string =
    process.env.KAFKA_TOPIC_INTELIPOST_CREATED;

  public static readonly KAFKA_TOPIC_NOTIFY_MESSAGE_WEBSOCKET: string =
    process.env.KAFKA_TOPIC_NOTIFY_MESSAGE_WEBSOCKET;

  public static readonly KAFKA_TOPIC_ORDER_NOTIFIED: string =
    process.env.KAFKA_TOPIC_ORDER_NOTIFIED;

  public static readonly RABBITMQ_ORDER_NOTIFICATION_QUEUE: string =
    process.env.RABBITMQ_ORDER_NOTIFICATION_QUEUE;

  public static readonly KAFKA_TOPIC_PARTNER_ORDER_TRACKING: string =
    process.env.KAFKA_TOPIC_PARTNER_ORDER_TRACKING;
}
