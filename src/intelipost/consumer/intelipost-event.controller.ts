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

    const { carrier, dataFormatted: intelipostData } =
      await this.intelipostMapper.mapInvoiceToIntelipost(data, false);

    await axios
      .post(Env.INTELIPOST_SHIPMENT_ORDER_ENDPOINT, intelipostData, config)
      .then(async response => {
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
          await this.invoiceService.updateStatus(
            data.key,
            data.order.externalOrderId,
            InvoiceStatusEnum.SUCCESS,
          );
          logger.log({
            info: `event received: intelipost.sent invoice key: ${data.key} orderSale: ${data.order.externalOrderId} invoice status: ${InvoiceStatusEnum.SUCCESS}`,
          });
        }
      })
      .catch(async error => {
        let invoiceStatus = InvoiceStatusEnum.ERROR;
        if (
          error.response.data.status === 'ERROR' &&
          error.response.status === 400
        ) {
          if (
            error?.response?.data?.messages &&
            Array.isArray(error?.response?.data?.messages)
          ) {
            const message = error?.response?.data?.messages.find(
              msg =>
                msg.key === 'shipmentOrder.save.already.existing.order.number',
            );
            if (message) {
              const { carrier, dataFormatted: intelipostData } =
                await this.intelipostMapper.mapInvoiceToIntelipost(data, true);

              await axios
                .post(
                  Env.INTELIPOST_SHIPMENT_ORDER_ENDPOINT,
                  intelipostData,
                  config,
                )
                .then(async retryResponse => {
                  if (retryResponse.status === 200) {
                    invoiceStatus = InvoiceStatusEnum.SUCCESS;
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
                      await this.intelipostService.intelipost(
                        order,
                        logger,
                        headers,
                      );
                      logger.log(
                        `Order with invoiceKey ${order.invoice.invoice_key} was saved`,
                      );
                    }
                  }
                })
                .catch(error => {
                  logger.error(error);
                  invoiceStatus = InvoiceStatusEnum.ERROR;
                });
            } else {
              logger.error(error);
              invoiceStatus = InvoiceStatusEnum.ERROR;
            }
          } else {
            logger.error(error);
            invoiceStatus = InvoiceStatusEnum.ERROR;
          }
        } else {
          logger.error(error);
          invoiceStatus = InvoiceStatusEnum.ERROR;
        }
        await this.invoiceService.updateStatus(
          data.key,
          data.order.externalOrderId,
          invoiceStatus,
        );
      });
  }
}
