import {
  KafkaResponse,
  KafkaService,
  SubscribeTopic,
} from '@infralabs/infra-nestjs-kafka';
import { Controller, Inject, Logger } from '@nestjs/common';
import { Env } from 'src/commons/environment/env';
import { CarrierService } from '../carrier.service';

@Controller()
export class ConsumerCarrierController {
  private logger = new Logger(ConsumerCarrierController.name);

  constructor(
    private readonly carrierService: CarrierService,
    @Inject('KafkaService') private kafkaProducer: KafkaService,
  ) {}

  @SubscribeTopic(Env.KAFKA_TOPIC_CARRIER_CREATED)
  async createCarrier(messageKafka: KafkaResponse<string>) {
    const value = JSON.parse(messageKafka.value);

    await this.removeFromQueue(
      Env.KAFKA_TOPIC_CARRIER_CREATED,
      messageKafka.partition,
      messageKafka.offset,
    );

    this.logger.log('carrier.created - Carrier consumer was received');
    await this.carrierService.create(value.data);
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_CARRIER_CHANGED)
  async updateCarrier(messageKafka: KafkaResponse<string>) {
    const value = JSON.parse(messageKafka.value);

    await this.removeFromQueue(
      Env.KAFKA_TOPIC_CARRIER_CHANGED,
      messageKafka.partition,
      messageKafka.offset,
    );
    this.logger.log('carrier.changed - Carrier consumer was received');
    await this.carrierService.update(value.data.id, value.data);
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

  // account.saleschannel.associated
  // account.saleschannel.unassociated
}
