import {
  KafkaResponse,
  KafkaService,
  SubscribeTopic,
} from '@infralabs/infra-nestjs-kafka';
import { Controller, Inject } from '@nestjs/common';
import { Env } from 'src/commons/environment/env';
import { LogProvider } from 'src/commons/providers/log/log-provider.interface';
import { CarrierService } from '../carrier.service';

@Controller()
export class ConsumerCarrierController {
  constructor(
    private readonly carrierService: CarrierService,
    @Inject('KafkaService') private kafkaProducer: KafkaService,
    @Inject('LogProvider')
    private readonly logger: LogProvider,
  ) {
    this.logger.instanceLogger(ConsumerCarrierController.name);
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_CARRIER_CREATED)
  async createCarrier({
    value,
    partition,
    headers,
    offset,
  }: KafkaResponse<string>) {
    const { data } = JSON.parse(value);

    try {
      this.logger.log(
        {
          key: 'ifc.freight.api.order.consumer-carrier-controller.createCarrier',
          message: `${Env.KAFKA_TOPIC_CARRIER_CREATED} - Carrier consumer was received`,
        },
        headers,
      );
      await this.carrierService.create(data);
    } catch (error) {
      this.logger.error(error);
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
    const { data } = JSON.parse(value);

    try {
      this.logger.log(
        {
          key: 'ifc.freight.api.order.consumer-carrier-controller.updateCarrier',
          message: `${Env.KAFKA_TOPIC_CARRIER_CHANGED} - Carrier consumer was received to update`,
        },
        headers,
      );
      await this.carrierService.updateConsumer(data.id, data);
    } catch (error) {
      this.logger.error(error);
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
