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
  async sendIntelipostData({ headers, data, account, retry = false }: any) {
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
        await this.intelipostMapper.mapInvoiceToIntelipost(data);

      const response = await axios
        .post(Env.INTELIPOST_SHIPMENT_ORDER_ENDPOINT, intelipostData, config)
        .then(res => res)
        .catch(error => error.response);

      const intelipostErrorKey =
        'shipmentOrder.save.already.existing.order.number';
      const isValidationError =
        response.data.status === 'ERROR' && response.status === 400;
      let existingOrderNumber = '';
      if (Array.isArray(response?.data?.messages)) {
        existingOrderNumber = response?.data?.messages.find(
          msg => msg.key === intelipostErrorKey,
        );
      }

      if (isValidationError && existingOrderNumber && !retry) {
        await this.retryIntelipostIntegration(
          { headers, data, account },
          logger,
        );
        return;
      }
      if (isValidationError && existingOrderNumber && retry) {
        throw new Error(intelipostErrorKey);
      }

      if (response.status === 200) {
        logger.log(
          `Order created successfully on Intelipost with orderSale: ${response?.data?.content?.sales_order_number} order: ${response?.data?.content?.order_number} and trackingUrl: ${response?.data?.content?.tracking_url}`,
        );

        const newOrders =
          this.intelipostMapper.mapResponseIntelipostToDeliveryHub(
            response.data.content,
            carrier,
            intelipostData.estimated_delivery_date,
          );

        const extra = account.storeCode
          ? {
              storeId: account.id,
              storeCode: account.storeCode,
              internalOrderId: data.order.internalOrderId,
              carrierName: carrier.carrier,
              carrierDocument: carrier.document,
            }
          : {};

        for await (const order of newOrders) {
          await this.intelipostService.intelipost(
            order,
            new InfraLogger(headers),
            headers,
            extra,
          );
        }
        await this.invoiceService.updateStatus(
          data.key,
          data.order.externalOrderId,
          InvoiceStatusEnum.SUCCESS,
        );
        return;
      }

      throw new Error(JSON.stringify(response?.data));
    } catch (error) {
      logger.error(
        new Error(
          `Error message: '${error.message}'. OrderSale: ${data.order.externalOrderId} order: ${data.order.internalOrderId} invoice key: ${data.key} and status: ${InvoiceStatusEnum.ERROR}`,
        ),
      );
      await this.invoiceService.updateStatus(
        data.key,
        data.order.externalOrderId,
        InvoiceStatusEnum.ERROR,
      );
    }
  }

  private async retryIntelipostIntegration(
    { headers, data, account },
    logger,
  ): Promise<void> {
    const newData = {
      ...data,
      order: {
        ...data.order,
        internalOrderId: `${data.order.internalOrderId}-${data.number}`,
      },
    };
    logger.log(
      `OrderSale (${data.order.externalOrderId}) Order (${data.order.internalOrderId}) already exists on Intelipost. Retrying with the new orderNumber: ${newData.order.internalOrderId}`,
    );
    await this.sendIntelipostData({
      headers,
      data: newData,
      account,
      retry: true,
    });
  }
}
