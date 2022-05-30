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
    private readonly intelipostService: InteliPostService,
    private readonly intelipostMapper: IntelipostMapper,
  ) {}

  @OnEvent('intelipost.sent')
  async sendIntelipostData({ headers, data }: any) {
    const logger = new InfraLogger(headers, OnEventIntelipostController.name);
    const apiKey = Env.INTELIPOST_SHIPMENT_ORDER_APIKEY;
    const platform = Env.INTELIPOST_SHIPMENT_ORDER_PLATFORM;
    const config: AxiosRequestConfig = {
      headers: {
        'APi-key': apiKey,
        platform,
      },
    };
    try {
      const { carrier, dataFormatted: intelipostData } =
        await this.intelipostMapper.mapInvoiceToIntelipost(data, false);

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
            carrier,
            intelipostData.estimated_delivery_date,
          );

        for await (const order of newOrders) {
          await this.intelipostService.intelipost(order, logger, headers);
          logger.log(
            `Order with invoiceKey ${order.invoice.invoice_key} was saved`,
          );
        }
      }
    } catch (error) {
      logger.error(error);

      if (error.message.includes('status code 400')) {
        logger.log('Received a status code 400, retrying other request');
        try {
          const { carrier, dataFormatted: intelipostData } =
            await this.intelipostMapper.mapInvoiceToIntelipost(data, true);

          const retryResponse = await axios.post(
            Env.INTELIPOST_SHIPMENT_ORDER_ENDPOINT,
            intelipostData,
            config,
          );

          if (retryResponse.status === 200) {
            logger.log(
              `Order created successfully on Intelipost with trackingUrl: ${retryResponse?.data?.content?.tracking_url}`,
            );

            const newOrders =
              this.intelipostMapper.mapResponseIntelipostToDeliveryHub(
                retryResponse.data.content,
                carrier,
                intelipostData.estimated_delivery_date,
              );

            for await (const order of newOrders) {
              await this.intelipostService.intelipost(order, logger, headers);
              logger.log(
                `Order with invoiceKey ${order.invoice.invoice_key} was saved`,
              );
            }
          }
        } catch (error) {
          logger.error(error);
        }
      }
    }
  }
}
