import {
  KafkaResponse,
  KafkaService,
  SubscribeTopic,
} from '@infralabs/infra-nestjs-kafka';
import { Inject, Controller } from '@nestjs/common';
import { LogProvider } from '@infralabs/infra-logger';

import { NestjsEventEmitter } from '../../commons/providers/event/nestjs-event-emitter';
import { Env } from '../../commons/environment/env';

import { InvoiceService } from '../invoice.service';

@Controller()
export class InvoiceController {
  constructor(
    private readonly eventEmitter: NestjsEventEmitter,
    private readonly invoiceService: InvoiceService,
    @Inject('KafkaService') private kafkaProducer: KafkaService,
    @Inject('LogProvider') private logger: LogProvider,
  ) {
    this.logger.context = InvoiceController.name;
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_INVOICE_CREATED)
  async create({ value, partition, offset }: KafkaResponse<string>) {
    try {
      this.logger.log(
        `Payload was received from the ${Env.KAFKA_TOPIC_INVOICE_CREATED} topic`,
      );
      const { data } = this.parseValueFromQueue(value);
      if (data.notfisFile) {
        await this.invoiceService.sendFtp(data, this.logger);
      }

      this.eventEmitter.emit('ftp.sent', data);
    } catch (error) {
      this.logger.error(error);
    } finally {
      await this.removeFromQueue(
        Env.KAFKA_TOPIC_INVOICE_CREATED,
        partition,
        offset,
      );
    }
  }

  private parseValueFromQueue(value: string) {
    try {
      return JSON.parse(value);
    } catch (error) {
      this.logger.error(error);
    }
    return { data: {}, user: {} };
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
