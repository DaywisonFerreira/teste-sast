import {
  KafkaResponse,
  KafkaService,
  SubscribeTopic,
} from '@infralabs/infra-nestjs-kafka';
import { Inject, Controller } from '@nestjs/common';

import { InfraLogger } from '@infralabs/infra-logger';
import { NestjsEventEmitter } from '../../commons/providers/event/nestjs-event-emitter';
import { Env } from '../../commons/environment/env';
import { AccountService } from '../../account/account.service';
import { InvoiceService } from '../invoice.service';

@Controller()
export class InvoiceController {
  constructor(
    private readonly eventEmitter: NestjsEventEmitter,
    private readonly invoiceService: InvoiceService,
    private readonly accountService: AccountService,
    @Inject('KafkaService') private kafkaProducer: KafkaService,
  ) {}

  @SubscribeTopic(Env.KAFKA_TOPIC_INVOICE_CREATED)
  async create({ value, partition, offset, headers }: KafkaResponse<string>) {
    const logger = new InfraLogger(headers, InvoiceController.name);
    try {
      logger.log(
        `Payload was received from the ${Env.KAFKA_TOPIC_INVOICE_CREATED} topic`,
      );
      const { data } = this.parseValueFromQueue(value);

      const account = await this.accountService.findOneLocation(data.accountId);
      if (data.notfisFile && account.generateNotfisFile) {
        await this.invoiceService.sendFtp(data, logger);
      }
      this.eventEmitter.emit('ftp.sent', data);
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
