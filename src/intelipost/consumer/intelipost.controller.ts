/* eslint-disable no-loop-func */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable radix */

import { LogProvider } from '@infralabs/infra-logger';
import { KafkaResponse, SubscribeTopic } from '@infralabs/infra-nestjs-kafka';
import { Controller, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import axios, { AxiosRequestConfig } from 'axios';

import { Env } from 'src/commons/environment/env';
import { InteliPostService } from '../intelipost.service';
import { IntelipostMapper } from '../mappers/intelipostMapper';

@Controller()
export class ConsumerIntelipostController {
  constructor(
    @Inject('LogProvider') private logger: LogProvider,
    private readonly storesService: InteliPostService,
    private readonly intelipostMapper: IntelipostMapper,
  ) {
    this.logger.context = ConsumerIntelipostController.name;
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_INTELIPOST_CREATED)
  async consumerCreateContract({ value }: KafkaResponse<string>) {
    const createIntelipostKafka = JSON.parse(value);

    await this.storesService.intelipost(
      createIntelipostKafka.data,
      this.logger,
    );
  }

  @OnEvent('ftp.sent')
  async sendIntelipostData(data: any) {
    try {
      const intelipostData = await this.intelipostMapper.mapInvoiceToIntelipost(
        data,
      );
      const apiKey = Env.INTELIPOST_SHIPMENT_ORDER_APIKEY;
      const platform = Env.INTELIPOST_SHIPMENT_ORDER_PLATFORM;
      const config: AxiosRequestConfig = {
        headers: {
          'APi-key': apiKey,
          platform,
        },
      };
      const response = await axios.post(
        Env.INTELIPOST_SHIPMENT_ORDER_ENDPOINT,
        intelipostData,
        config,
      );
      if (response.status === 200) {
        this.logger.log({
          message: 'Intelipost - Shipping order successfully completed!',
          data: response.data,
        });
      }
    } catch (error) {
      this.logger.log({
        error: error.message,
        message: error?.response?.data?.messages,
      });
    }
  }
}
