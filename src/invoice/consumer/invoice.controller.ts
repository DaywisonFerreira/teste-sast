import {
  KafkaResponse,
  KafkaService,
  SubscribeTopic,
} from '@infralabs/infra-nestjs-kafka';
import { Inject, Controller } from '@nestjs/common';

import { InfraLogger } from '@infralabs/infra-logger';
import { AccountService } from 'src/account/account.service';
import { NestjsEventEmitter } from '../../commons/providers/event/nestjs-event-emitter';
import { Env } from '../../commons/environment/env';
import { InvoiceService } from '../invoice.service';
import { OrderService } from '../../order/order.service';
import { CarrierService } from '../../carrier/carrier.service';

@Controller()
export class ConsumerInvoiceController {
  constructor(
    private readonly accountService: AccountService,
    private readonly eventEmitter: NestjsEventEmitter,
    private readonly invoiceService: InvoiceService,
    private readonly orderService: OrderService,
    private readonly carrierService: CarrierService,
    @Inject('KafkaService') private kafkaProducer: KafkaService,
  ) {}

  @SubscribeTopic(Env.KAFKA_TOPIC_INVOICE_CREATED)
  async create({ value, partition, offset, headers }: KafkaResponse<string>) {
    const logger = new InfraLogger(headers, ConsumerInvoiceController.name);
    try {
      const { data } = this.parseValueFromQueue(value);
      const accountId = headers['X-Tenant-Id'];

      logger.log(
        `${Env.KAFKA_TOPIC_INVOICE_CREATED} - Invoice was received with the key ${data.key}`,
      );

      if (data.notfisFile && data.notfisFileName) {
        await this.invoiceService.sendFtp(data, accountId, logger);
      }

      const order = await this.orderService.findByKeyAndInternalOrderId(
        data.key, // 35220634364408000164550020000018301152292010
        data.order.internalOrderId, // 667347710
      );

      if (!order) {
        await this.invoiceService.updateStatus(
          data.key,
          data.internalOrderId,
          'pending',
        );
      } else {
        const { carrier } = data;

        const _carrier = await this.carrierService.findByDocument(
          carrier.document,
        );

        const carrierdeliveryMethod = _carrier?.externalDeliveryMethods;

        if (carrierdeliveryMethod) {
          const deliveryMethod = carrierdeliveryMethod.find(
            item => order.invoice.deliveryMethod === item.deliveryModeName,
          );
          if (!deliveryMethod) {
            await this.invoiceService.updateStatus(
              data.key,
              data.internalOrderId,
              'error',
            );
            return;
          }
          data.carrier.externalDeliveryMethodId =
            deliveryMethod.externalDeliveryMethodId;
        }
      }

      const account = await this.accountService.findOne(accountId);

      if (account.integrateIntelipost)
        this.eventEmitter.emit('intelipost.sent', { headers, data });
    } catch (error) {
      logger.error(error);
    } finally {
      await this.removeFromQueue(
        Env.KAFKA_TOPIC_INVOICE_CREATED,
        partition,
        offset,
      );
    }
  }

  private parseValueFromQueue(value: string) {
    const data = JSON.parse(value);

    return data;
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
