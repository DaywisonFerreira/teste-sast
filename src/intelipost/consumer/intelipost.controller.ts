/* eslint-disable no-loop-func */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable radix */

import { InfraLogger } from '@infralabs/infra-logger';
import {
  KafkaResponse,
  SubscribeTopic,
  KafkaService,
} from '@infralabs/infra-nestjs-kafka';
import { Controller, Inject } from '@nestjs/common';

import { Env } from 'src/commons/environment/env';
import { CreateIntelipost } from '../dto/create-intelipost.dto';
import { InteliPostService } from '../intelipost.service';

@Controller()
export class ConsumerIntelipostController {
  constructor(
    private readonly inteliPostService: InteliPostService,
    @Inject('KafkaService') private kafkaProducer: KafkaService,
  ) {}

  @SubscribeTopic(Env.KAFKA_TOPIC_INTELIPOST_CREATED)
  async consumerCreateContract({
    value,
    partition,
    headers,
    offset,
  }: KafkaResponse<string>) {
    const logger = new InfraLogger(headers, ConsumerIntelipostController.name);
    const { data }: { data: CreateIntelipost } = JSON.parse(value);

    logger.verbose(
      `${Env.KAFKA_TOPIC_INTELIPOST_CREATED} - Intelipost tracking received for orderSale ${data.sales_order_number} in the integration queue`,
    );

    await this.kafkaProducer.commitOffsets([
      {
        topic: Env.KAFKA_TOPIC_INTELIPOST_CREATED,
        partition,
        offset: String(offset + 1),
      },
    ]);

    await this.inteliPostService.intelipost(
      data,
      new InfraLogger(headers),
      headers,
    );
  }
}
