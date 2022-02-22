/* eslint-disable no-loop-func */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable radix */

import { LogProvider } from '@infralabs/infra-logger';
import { KafkaResponse, SubscribeTopic } from '@infralabs/infra-nestjs-kafka';
import { Controller, Inject } from '@nestjs/common';
import { Env } from 'src/commons/environment/env';
import { InteliPostService } from '../intelipost.service';

@Controller()
export class ConsumerContractController {
  constructor(
    @Inject('LogProvider') private logger: LogProvider,
    private readonly storesService: InteliPostService,
  ) {
    this.logger.context = ConsumerContractController.name;
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_INTELIPOST_CREATED)
  async consumerCreateContract({ value }: KafkaResponse<string>) {
    const createIntelipostKafka = JSON.parse(value);

    await this.storesService.inteliPost(
      createIntelipostKafka.data,
      this.logger,
    );
  }
}
