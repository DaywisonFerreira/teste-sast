import {
  KafkaResponse,
  KafkaService,
  SubscribeTopic,
} from '@infralabs/infra-nestjs-kafka';
import { Controller, Inject } from '@nestjs/common';
import { Env } from 'src/commons/environment/env';
import { InfraLogger } from '@infralabs/infra-logger';
import { CarrierService } from '../carrier.service';

@Controller()
export class ConsumerCarrierController {
  constructor(
    private readonly carrierService: CarrierService,
    @Inject('KafkaService') private kafkaProducer: KafkaService,
  ) {}

  @SubscribeTopic(Env.KAFKA_TOPIC_CARRIER_CREATED)
  async createCarrier({
    value,
    partition,
    headers,
    offset,
  }: KafkaResponse<string>) {
    const logger = new InfraLogger(headers, ConsumerCarrierController.name);
    const { data } = JSON.parse(value);

    try {
      logger.log(
        `${Env.KAFKA_TOPIC_CARRIER_CREATED} - Carrier consumer was received`,
      );
      await this.carrierService.create(data);
    } catch (error) {
      logger.error(error);
    } finally {
      await this.removeFromQueue(
        Env.KAFKA_TOPIC_CARRIER_CREATED,
        partition,
        offset,
      );
    }
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_CARRIER_CHANGED)
  async updateCarrier({
    value,
    partition,
    headers,
    offset,
  }: KafkaResponse<string>) {
    const logger = new InfraLogger(headers, ConsumerCarrierController.name);
    const { data } = JSON.parse(value);

    try {
      logger.log(
        `${Env.KAFKA_TOPIC_CARRIER_CHANGED} - Carrier consumer was received`,
      );
      await this.carrierService.updateConsumer(data.id, data);
    } catch (error) {
      logger.error(error);
    } finally {
      await this.removeFromQueue(
        Env.KAFKA_TOPIC_CARRIER_CHANGED,
        partition,
        offset,
      );
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
