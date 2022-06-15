/* eslint-disable no-loop-func */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable radix */

import { InfraLogger } from '@infralabs/infra-logger';
import { Controller } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import axios, { AxiosRequestConfig } from 'axios';

import { Env } from 'src/commons/environment/env';
import { InvoiceStatusEnum } from '../../invoice/enums/invoice-status-enum';
import { InvoiceService } from '../../invoice/invoice.service';
import { InteliPostService } from '../intelipost.service';
import { IntelipostMapper } from '../mappers/intelipostMapper';

@Controller()
export class OnEventIntelipostController {
  constructor(
    private readonly intelipostService: InteliPostService,
    private readonly intelipostMapper: IntelipostMapper,
    private readonly invoiceService: InvoiceService,
  ) {}

  @OnEvent('intelipost.sent')
  async sendIntelipostData({ headers, data, retry = false }: any) {
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
        await this.intelipostMapper.mapInvoiceToIntelipost(data, retry);

      const response = await axios
        .post(Env.INTELIPOST_SHIPMENT_ORDER_ENDPOINT, intelipostData, config)
        .then(res => res)
        .catch(error => error.response);

      response.status = 429;

      if (response.status === 429 || response.status === 500) {
        const totalSends = parseInt(Env.INTELIPOST_TOTAL_REQUESTS || '6');
        for (let resend = 1; resend <= totalSends; ) {
          setTimeout(async () => {
            const response = await axios
              .post(
                Env.INTELIPOST_SHIPMENT_ORDER_ENDPOINT,
                intelipostData,
                config,
              )
              .then(res => res)
              .catch(error => error.response);

            if (response.status === 429 || response.status === 500) {
              if (resend === totalSends) {
                throw new Error('Number of attempts exceeded');
              } else {
                resend++;
              }
            }
          }, parseInt(Env.INTELIPOST_RESEND_TIME) * 1000);
        }
        return;
      }

      const isValidationError =
        response.data.status === 'ERROR' && response.status === 400;
      let existingOrderNumber = '';
      if (Array.isArray(response?.data?.messages)) {
        existingOrderNumber = response?.data?.messages.find(
          msg => msg.key === 'shipmentOrder.save.already.existing.order.number',
        );
      }

      if (isValidationError && existingOrderNumber && !retry) {
        await this.retryIntelipostIntegration({ headers, data }, logger);
        return;
      }
      if (retry) {
        // TODO: corrigir isso
        throw new Error('shipmentOrder.save.already.existing.order.number');
      }

      if (response.status === 200) {
        logger.log(
          `Order created successfully on Intelipost with orderSale: ${response?.data?.content?.sales_order_number} and trackingUrl: ${response?.data?.content?.tracking_url}`,
        );

        const newOrders =
          this.intelipostMapper.mapResponseIntelipostToDeliveryHub(
            response.data.content,
            carrier,
            intelipostData.estimated_delivery_date,
          );

        for await (const order of newOrders) {
          await this.intelipostService.intelipost(
            order,
            new InfraLogger(headers),
            headers,
          );
        }
        await this.invoiceService.updateStatus(
          data.key,
          data.order.externalOrderId,
          InvoiceStatusEnum.SUCCESS,
        );
      }
    } catch (error) {
      logger.log(
        `Error: ${error.message}. OrderSale: ${data.order.externalOrderId} invoice key: ${data.key} and status: ${InvoiceStatusEnum.ERROR}`,
      );
      await this.invoiceService.updateStatus(
        data.key,
        data.order.externalOrderId,
        InvoiceStatusEnum.ERROR,
      );
      // throw error;
    }
  }

  private async retryIntelipostIntegration(
    { headers, data },
    logger,
  ): Promise<void> {
    logger.log(
      `Order (${data.order.internalOrderId}) already exists on Intelipost. Retrying with the new orderNumber: ${data.order.internalOrderId}-${data.number}`,
    );
    await this.sendIntelipostData({ headers, data, retry: true });
  }
}
