/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import {
  KafkaResponse,
  KafkaService,
  SubscribeTopic,
} from '@infralabs/infra-nestjs-kafka';
import { Controller, Inject, Logger } from '@nestjs/common';
import { Channel } from 'amqplib';
import { existsSync, promises } from 'fs';
import { NotificationTypes } from 'src/commons/enums/notification.enum';
import { OriginEnum } from 'src/commons/enums/origin-enum';
import { LogProvider } from 'src/commons/providers/log/log-provider.interface';
import { v4 as uuidV4 } from 'uuid';
import { Env } from '../../commons/environment/env';
import { EventProvider } from '../../commons/providers/event/nestjs-event-provider.interface';
import { IHubOrder } from '../interfaces/order.interface';
import { OrderMapper } from '../mappers/orderMapper';
import { OrderService } from '../order.service';

@Controller()
export class ConsumerOrderController {
  constructor(
    @Inject('KafkaService') private kafkaProducer: KafkaService,
    private readonly orderService: OrderService,
    @Inject('EventProvider')
    private readonly eventEmitter: EventProvider,
    @Inject('LogProvider')
    private readonly logger: LogProvider,
  ) {
    this.logger.instanceLogger(ConsumerOrderController.name);
  }

  @RabbitSubscribe({
    exchange: Env.RABBITMQ_ORDER_NOTIFICATION_EXCHANGE,
    routingKey: '',
    queue: Env.RABBITMQ_ORDER_NOTIFICATION_QUEUE,
    errorHandler: (channel: Channel, msg: any, error) => {
      const logger = new Logger('ConsumerOrderController.name');
      logger.error(error.message, error.stack?.split('\n'));
      channel.reject(msg, false);
    },
  })
  public async orderNotificationHandler(order: IHubOrder) {
    const headers = {
      'X-Version': '1.0',
      'X-Correlation-Id': uuidV4(),
      'X-Tenant-Id': order.storeId,
    };

    try {
      if (
        order.logisticInfo &&
        order.logisticInfo[0].deliveryChannel === 'delivery' &&
        (order.status === 'dispatched' || order.status === 'invoiced')
      ) {
        this.logger.log(
          {
            key: 'ifc.freight.api.order.consumer-order-controller.orderNotificationHandler',
            message: `${Env.RABBITMQ_ORDER_NOTIFICATION_QUEUE} - iHub order received with orderSale ${order.externalOrderId} order ${order.erpInfo?.externalOrderId} in the integration queue`,
          },
          headers,
        );

        const orderToSaves: Array<any> = OrderMapper.mapMessageToOrders(order);
        const ordersFilter = [];
        await Promise.all(
          orderToSaves.map(async orderToSave => {
            ordersFilter.push({
              externalOrderId: orderToSave.orderSale,
              key: orderToSave.invoice.key,
            });
            return this.orderService.merge(
              headers,
              {
                orderSale: orderToSave.orderSale,
                'invoice.key': orderToSave.invoice.key,
              },
              { ...orderToSave },
              OriginEnum.IHUB,
            );
          }),
        );

        if (orderToSaves.length) {
          this.logger.log(
            {
              key: 'ifc.freight.api.order.consumer-order-controller.orderNotificationHandler.saved',
              message: `OrderSale: ${orderToSaves[0].orderSale} order: ${
                orderToSaves[0].order
              } with invoiceKeys ${orderToSaves[0].invoiceKeys.join(
                ',',
              )} was saved`,
            },
            headers,
          );
        }

        ordersFilter.forEach(filter => {
          this.eventEmitter.emit('invoice.reprocess', filter);
        });
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_FREIGHT_ORDERS_EXPORT)
  async consumerExportOrders({
    value,
    partition,
    headers,
    offset,
  }: KafkaResponse<string>) {
    let file: any;
    const { data, user } = JSON.parse(value);

    await this.removeFromQueue(
      Env.KAFKA_TOPIC_FREIGHT_ORDERS_EXPORT,
      partition,
      offset,
    );

    this.logger.log(
      {
        key: 'ifc.freight.api.order.consumer-order-controller.consumerExportOrders',
        message: `${Env.KAFKA_TOPIC_FREIGHT_ORDERS_EXPORT} - Report request by user ${user.id} was received for storeId: ${data.storeId} - From ${data.orderCreatedAtFrom} to ${data.orderCreatedAtTo}`,
      },
      headers,
    );
    try {
      file = await this.orderService.exportData(data, user.id);

      if (file) {
        const urlFile = await this.uploadFile(file, headers);

        await this.kafkaProducer.send(
          Env.KAFKA_TOPIC_NOTIFY_MESSAGE_WEBSOCKET,
          {
            headers: {
              'X-Correlation-Id': headers['X-Correlation-Id'] || uuidV4(),
              'X-Version': '1.0',
            },
            value: {
              data: {
                to: user.id,
                origin: Env.APPLICATION_NAME,
                type: NotificationTypes.OrdersExport,
                payload: { urlFile },
              },
            },
          },
        );
      } else {
        this.logger.log(
          {
            key: 'ifc.freight.api.order.consumer-order-controller.consumerExportOrders.no-records',
            message: 'No records found for this account.',
          },
          headers,
        );
      }
    } catch (error) {
      this.logger.error(error);
    } finally {
      if (file && existsSync(file.path)) {
        await this.deleteFileLocally(file.path);
      }
    }
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_PARTNER_ORDER_TRACKING)
  async updateTrackingStatus({
    value,
    partition,
    headers,
    offset,
  }: KafkaResponse<string>) {
    const { data } = JSON.parse(value);

    try {
      // if (
      //   !Env.TRACKING_CONNECTORS_ENABLES.includes(metadata?.integrationName)
      // ) {
      //   logger.log(
      //     `Integration ${metadata?.integrationName} it's not enable to update tracking`,
      //   );
      //   return;
      // }

      this.logger.log(
        {
          key: 'ifc.freight.api.order.consumer-order-controller.updateTrackingStatus',
          message: `${Env.KAFKA_TOPIC_PARTNER_ORDER_TRACKING} - New tracking received to invoice key: ${data?.tracking?.sequentialCode} - status: ${data?.tracking?.statusCode?.micro}`,
        },
        headers,
      );

      await this.orderService.updateOrderStatus(
        data,
        headers,
        OriginEnum.FREIGHT_CONNECTOR,
      );
    } catch (error) {
      this.logger.error(error);
    } finally {
      await this.removeFromQueue(
        Env.KAFKA_TOPIC_PARTNER_ORDER_TRACKING,
        partition,
        offset,
      );
    }
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_FREIGHT_CONSOLIDATED_REPORT_ORDERS)
  async consumerReportConsolidated({
    value,
    partition,
    headers,
    offset,
  }: KafkaResponse<string>) {
    await this.removeFromQueue(
      Env.KAFKA_TOPIC_FREIGHT_CONSOLIDATED_REPORT_ORDERS,
      partition,
      offset,
    );
    const { data, user } = JSON.parse(value);

    this.logger.log(
      {
        key: 'ifc.freight.api.order.consumer-order-controller.consumerReportConsolidated',
        message: `Consumer report consolidated`,
      },
      headers,
    );
    this.eventEmitter.emit('create.report.consolidated', {
      data,
      headers,
      user,
    });
  }

  private async deleteFileLocally(path: string) {
    await promises.unlink(path);
  }

  private async uploadFile(fileLocally: any, headers: any) {
    try {
      this.logger.log(
        {
          key: 'ifc.freight.api.order.consumer-order-controller.uploadFile.start',
          message: `Starting file upload (${fileLocally.fileName})`,
        },
        headers,
      );
      const credentials = new StorageSharedKeyCredential(
        Env.AZURE_ACCOUNT_NAME,
        Env.AZURE_ACCOUNT_KEY,
      );
      const blobServiceClient = new BlobServiceClient(
        Env.AZURE_BS_STORAGE_URL,
        credentials,
      );
      const containerClient = blobServiceClient.getContainerClient(
        Env.AZURE_BS_CONTAINER_NAME,
      );
      const blockBlobClient = containerClient.getBlockBlobClient(
        fileLocally.fileName,
      );
      await blockBlobClient.uploadFile(fileLocally.path);

      this.logger.log(
        {
          key: 'ifc.freight.api.order.consumer-order-controller.uploadFile.finish',
          message: `Finish file upload (${fileLocally.fileName})`,
        },
        headers,
      );
      return `${String(Env.AZURE_BS_STORAGE_URL)}/${String(
        Env.AZURE_BS_CONTAINER_NAME,
      )}/${fileLocally.fileName}`;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  private async removeFromQueue(
    topic: string,
    partition: number,
    offset: number,
  ) {
    await this.kafkaProducer.commitOffsets([
      {
        topic,
        partition,
        offset: String(offset + 1),
      },
    ]);
  }
}
