import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Channel } from 'amqplib';
import {
  KafkaResponse,
  KafkaService,
  SubscribeTopic,
} from '@infralabs/infra-nestjs-kafka';
import { Controller, Inject } from '@nestjs/common';
import { InfraLogger } from '@infralabs/infra-logger';
import { lightFormat } from 'date-fns';
import { utils, writeFile } from 'xlsx';
import { existsSync, mkdirSync, promises } from 'fs';
import { createBlobService } from 'azure-storage';
import { v4 as uuidV4 } from 'uuid';
import { Env } from '../../commons/environment/env';
import { CsvMapper } from '../mappers/csvMapper';
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
    const logger = new InfraLogger(
      {
        'X-Version': '1.0',
        'X-Correlation-Id': uuidV4(),
        'X-Tenant-Id': order.storeId,
      },
      ConsumerOrderController.name,
    );

    logger.verbose(
      `delivery_hub_order_notification_${Env.NODE_ENV}_q - iHub order received with orderSale ${order.externalOrderId} in the integration queue`,
    );
    try {
      if (
        order.logisticInfo &&
        order.logisticInfo[0].deliveryChannel === 'delivery' &&
        (order.status === 'dispatched' || order.status === 'invoiced')
      ) {
        const orderToSaves: Array<any> = OrderMapper.mapMessageToOrders(order);
        await Promise.all(
          orderToSaves.map(async orderToSave =>
            this.orderService.merge(
              {
                orderSale: orderToSave.orderSale,
                'invoice.key': orderToSave.invoice.key,
              },
              { ...orderToSave },
              'ihub',
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
    let file;
    const { data, user } = JSON.parse(value);
    const logger = new InfraLogger(headers, ConsumerOrderController.name);

    await this.removeFromQueue(
      Env.KAFKA_TOPIC_FREIGHT_ORDERS_EXPORT,
      partition,
      offset,
    );

    logger.log(
      `${Env.KAFKA_TOPIC_FREIGHT_ORDERS_EXPORT} - Report request was received for storeId: ${data.storeId} - From ${data.rderCreatedAtFrom} to ${data.orderCreatedAtTo}`,
    );
    try {
      const dataToFormat = await this.orderService.exportData(data, {
        lean: true,
      });

      const dataFormatted = CsvMapper.mapOrderToCsv(dataToFormat);

      file = this.createCsvLocally(dataFormatted, data);
      const urlFile = await this.uploadFile(file);

      await this.kafkaProducer.send(
        Env.KAFKA_TOPIC_FREIGHT_ORDERS_EXPORT_NOTIFY,
        {
          headers: {
            'X-Correlation-Id': headers['X-Correlation-Id'] || uuidV4(),
            'X-Version': '1.0',
          },
          key: uuidV4(),
          value: JSON.stringify({
            data: {
              urlFile,
            },
            user,
          }),
        },
      );
    } catch (error) {
      logger.error(error);
    } finally {
      if (existsSync(file.path)) {
        await this.deleteFileLocally(file.path);
      }
    }
  }

  private createCsvLocally(data: unknown[], filter: any) {
    const directory_path =
      process.env.NODE_ENV !== 'local'
        ? `${process.cwd()}/dist/tmp`
        : `${process.cwd()}/src/tmp`;

    if (!existsSync(directory_path)) {
      mkdirSync(directory_path);
    }

    const workbook = utils.book_new();
    const worksheet = utils.json_to_sheet(data);

    utils.book_append_sheet(workbook, worksheet);

    const from = lightFormat(
      new Date(`${filter.orderCreatedAtFrom}T00:00:00`),
      'ddMMyyyy',
    );
    const to = lightFormat(
      new Date(`${filter.orderCreatedAtTo}T23:59:59`),
      'ddMMyyyy',
    );

    const fileName = `Status_Entregas_${from}-${to}.csv`;

    writeFile(workbook, `${directory_path}/${fileName}`);

    return {
      path: `${directory_path}/${fileName}`,
      fileName,
    };
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
