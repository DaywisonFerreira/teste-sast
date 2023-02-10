/* eslint-disable no-loop-func */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable radix */

import {
  KafkaResponse,
  SubscribeTopic,
  KafkaService,
} from '@infralabs/infra-nestjs-kafka';
import { Controller, Inject } from '@nestjs/common';

import { Env } from 'src/commons/environment/env';
import { LogProvider } from 'src/commons/providers/log/log-provider.interface';
import { CreateIntelipost } from '../dto/create-intelipost.dto';
import { InteliPostService } from '../intelipost.service';

@Controller()
export class ConsumerIntelipostController {
  constructor(
    private readonly inteliPostService: InteliPostService,
    @Inject('KafkaService') private kafkaProducer: KafkaService,
    @Inject('LogProvider')
    private readonly logger: LogProvider,
  ) {
    this.logger.instanceLogger(ConsumerIntelipostController.name);
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_INTELIPOST_CREATED)
  async consumerCreateContract({
    value,
    partition,
    headers,
    offset,
  }: KafkaResponse<string>) {
    try {
      const { data }: { data: CreateIntelipost } = JSON.parse(value);

      this.logger.log(
        {
          key: 'ifc.freight.api.order.consumer-intellipost-controller.consumerCreateContract',
          message: `${Env.KAFKA_TOPIC_INTELIPOST_CREATED} - Intelipost tracking received for orderSale: ${data?.sales_order_number} order: ${data?.order_number} in the integration queue`,
        },
        {},
      );

      await this.inteliPostService.intelipost(data, headers);
    } catch (error) {
      this.logger.error(error);
    } finally {
      await this.kafkaProducer.commitOffsets([
        {
          topic: Env.KAFKA_TOPIC_INTELIPOST_CREATED,
          partition,
          offset: String(offset + 1),
        },
      ]);
    }
  }
}
