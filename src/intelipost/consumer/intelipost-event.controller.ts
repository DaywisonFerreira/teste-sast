/* eslint-disable no-loop-func */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable radix */

import { InfraLogger } from '@infralabs/infra-logger';
import { Controller } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import axios, { AxiosRequestConfig } from 'axios';

import { Env } from 'src/commons/environment/env';
import { InteliPostService } from '../intelipost.service';
import { IntelipostMapper } from '../mappers/intelipostMapper';

@Controller()
export class OnEventIntelipostController {
  constructor(
    private readonly storesService: InteliPostService,
    private readonly intelipostMapper: IntelipostMapper,
  ) {}

  @OnEvent('intelipost.sent')
  async sendIntelipostData({ headers, data }: any) {
    const logger = new InfraLogger(headers, OnEventIntelipostController.name);
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
        logger.log(
          `Order created successfully on Intelipost with trackingUrl: ${response?.data?.content?.tracking_url}`,
        );

        const newOrders =
          this.intelipostMapper.mapResponseIntelipostToDeliveryHub(
            response.data.content,
          );

        for await (const order of newOrders) {
          await this.storesService.intelipost(order, logger);
          logger.log(
            `Order with invoiceKey ${order.invoice.invoice_key} was saved`,
          );
        }
      }
    } catch (error) {
      logger.log({
        error: error.message,
        message: error?.response?.data?.messages,
      });
    }
  }
}
