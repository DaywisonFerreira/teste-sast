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
import { OnEvent } from '@nestjs/event-emitter';
import axios, { AxiosRequestConfig } from 'axios';

import { Env } from 'src/commons/environment/env';
import { CreateIntelipost } from '../dto/create-intelipost.dto';
import { InteliPostService } from '../intelipost.service';
import { IntelipostMapper } from '../mappers/intelipostMapper';

@Controller()
export class ConsumerIntelipostController {
  constructor(
    private readonly storesService: InteliPostService,
    private readonly intelipostMapper: IntelipostMapper,
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

    try {
      const order = await this.storesService.intelipost(data, logger);

      logger.log(`Order with invoiceKey ${order.invoice.key} was saved`);
    } catch (error) {
      logger.error(error);
    } finally {
      await this.removeFromQueue(
        Env.KAFKA_TOPIC_INTELIPOST_CREATED,
        partition,
        offset,
      );
    }
  }

  @OnEvent('ftp.sent')
  async sendIntelipostData(data: any) {
    const logger = new InfraLogger({}, ConsumerIntelipostController.name);
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
        logger.log({
          message: 'Intelipost - Shipping order successfully completed!',
          data: response.data,
        });
      }
    } catch (error) {
      logger.log({
        error: error.message,
        message: error?.response?.data?.messages,
      });
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
