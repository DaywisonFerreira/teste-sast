import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Channel } from 'amqplib';
import {
  KafkaResponse,
  KafkaService,
  SubscribeTopic,
} from '@infralabs/infra-nestjs-kafka';
import { Controller, Inject } from '@nestjs/common';
import { InfraLogger } from '@infralabs/infra-logger';
import { existsSync, promises } from 'fs';
import { createBlobService } from 'azure-storage';
import { v4 as uuidV4 } from 'uuid';
import { NotificationTypes } from 'src/commons/enums/notification.enum';
import { Env } from '../../commons/environment/env';
import { OrderService } from '../order.service';
import { IHubOrder } from '../interfaces/order.interface';
import { OrderMapper } from '../mappers/orderMapper';

@Controller()
export class ConsumerOrderController {
  constructor(
    @Inject('KafkaService') private kafkaProducer: KafkaService,
    private readonly orderService: OrderService,
  ) {}

  @RabbitSubscribe({
    exchange: Env.RABBITMQ_ORDER_NOTIFICATION_EXCHANGE,
    routingKey: '',
    queue: `delivery_hub_order_notification_${Env.NODE_ENV}_q`,
    errorHandler: (channel: Channel, msg: any, error) => {
      const logger = new InfraLogger(
        {
          'X-Version': '1.0',
          'X-Correlation-Id': uuidV4(),
          'X-Tenant-Id': msg.storeId,
        },
        ConsumerOrderController.name,
      );
      logger.error(error);
      channel.reject(msg, false);
    },
  })
  public async orderNotificationHandler(order: IHubOrder) {
    const headers = {
      'X-Version': '1.0',
      'X-Correlation-Id': uuidV4(),
      'X-Tenant-Id': order.storeId,
    };

    const logger = new InfraLogger(headers, ConsumerOrderController.name);

    logger.verbose(
      `delivery_hub_order_notification_${Env.NODE_ENV}_q - iHub order received with orderSale ${order.externalOrderId} in the integration queue`,
    );
    try {
      if (
        order.logisticInfo &&
        (order.logisticInfo[0].deliveryChannel === 'delivery' ||
          order.logisticInfo[0].deliveryChannel === 'deliver') &&
        (order.status === 'dispatched' || order.status === 'invoiced')
      ) {
        const orderToSaves: Array<any> = OrderMapper.mapMessageToOrders(order);
        await Promise.all(
          orderToSaves.map(async orderToSave =>
            this.orderService.merge(
              headers,
              {
                orderSale: orderToSave.orderSale,
                'invoice.key': orderToSave.invoice.key,
              },
              { ...orderToSave },
              'ihub',
              logger,
            ),
          ),
        );
        if (orderToSaves.length) {
          logger.log(
            `Order with invoiceKeys ${orderToSaves[0].invoiceKeys.join(
              ',',
            )} was saved`,
          );
        }
      }
    } catch (error) {
      logger.error(error);
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
    const logger = new InfraLogger(headers, ConsumerOrderController.name);

    await this.removeFromQueue(
      Env.KAFKA_TOPIC_FREIGHT_ORDERS_EXPORT,
      partition,
      offset,
    );

    logger.log(
      `${Env.KAFKA_TOPIC_FREIGHT_ORDERS_EXPORT} - Report request by user ${user.id} was received for storeId: ${data.storeId} - From ${data.orderCreatedAtFrom} to ${data.orderCreatedAtTo}`,
    );
    try {
      file = await this.orderService.exportData(data, user.id, logger);
      const urlFile = await this.uploadFile(file);

      await this.kafkaProducer.send(Env.KAFKA_TOPIC_NOTIFY_MESSAGE_WEBSOCKET, {
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
      });
    } catch (error) {
      logger.error(error);
    } finally {
      if (existsSync(file.path)) {
        await this.deleteFileLocally(file.path);
      }
    }
  }

  private async deleteFileLocally(path: string) {
    await promises.unlink(path);
  }

  private uploadFile(fileLocally: any) {
    return new Promise((resolve, reject) => {
      const blobSvc = createBlobService(String(Env.AZURE_BS_ACCESS_KEY));
      blobSvc.createBlockBlobFromLocalFile(
        String(Env.AZURE_BS_CONTAINER_NAME),
        fileLocally.fileName,
        fileLocally.path,
        error => {
          if (error) {
            reject(error);
          }
          resolve(
            `${String(Env.AZURE_BS_STORAGE_URL)}/${String(
              process.env.AZURE_BS_CONTAINER_NAME,
            )}/${fileLocally.fileName}`,
          );
        },
      );
    });
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
