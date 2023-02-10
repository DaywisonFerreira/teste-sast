/* eslint-disable no-loop-func */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable radix */
import { Types } from 'mongoose';
import { Controller, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { Env } from 'src/commons/environment/env';
import { LogProvider } from 'src/commons/providers/log/log-provider.interface';
import { ApiGateway } from '../../commons/providers/api/api-gateway.interface';
import { IntelipostApiGatewayResponse } from '../../commons/providers/api/intelipost-api-gateway';
import { InvoiceStatusEnum } from '../../invoice/enums/invoice-status-enum';
import { InvoiceService } from '../../invoice/invoice.service';
import { CarrierService } from '../../carrier/carrier.service';
import { AccountService } from '../../account/account.service';
import { InteliPostService } from '../intelipost.service';
import { IntelipostMapper } from '../mappers/intelipostMapper';

@Controller()
export class OnEventIntelipostController {
  constructor(
    private readonly intelipostService: InteliPostService,
    private readonly intelipostMapper: IntelipostMapper,
    private readonly invoiceService: InvoiceService,
    private readonly carrierService: CarrierService,
    private readonly accountService: AccountService,
    @Inject('ApiGateway')
    private readonly intelipostApiGateway: ApiGateway,
    @Inject('LogProvider')
    private readonly logger: LogProvider,
  ) {
    this.logger.instanceLogger(OnEventIntelipostController.name);
  }

  @OnEvent('intelipost.sent')
  async sendIntelipostData({ headers, data, account, retry = false }: any) {
    this.logger.log(
      {
        key: 'ifc.freight.api.order.on-event-intellipost-controller.sendIntelipostData',
        message: `Sending ${account} data to Intellipost`,
      },
      headers,
    );

    try {
      const location = await this.accountService.findOneLocationByDocument(
        data.emitter.document,
        account.id,
      );

      if (
        !location.externalWarehouseCode ||
        location.externalWarehouseCode === ''
      ) {
        throw new Error('Location is not configured');
      }

      const carrier = await this.carrierService.findByDocument(
        data.carrier.document,
      );

      const intelipostData = await this.intelipostMapper.mapInvoiceToIntelipost(
        data,
        location,
      );

      let response: IntelipostApiGatewayResponse<any>;

      const totalSends = Env.INTELIPOST_TOTAL_RESEND;
      for (let resend = 1; resend <= totalSends; resend++) {
        response = await this.intelipostApiGateway.post(intelipostData);

        const error = [429, 502].includes(response?.status);

        if (error && resend + 1 > totalSends) {
          throw new Error('Number of attempts exceeded');
        } else if (error) {
          await new Promise(resolve =>
            setTimeout(resolve, Env.INTELIPOST_SLEEP_RESEND),
          );
          this.logger.log(
            {
              key: 'ifc.freight.api.order.on-event-intellipost-controller.sendIntelipostData.error',
              message: `Error when try to create OrderSale (${data.order.externalOrderId}) Order (${data.order.internalOrderId}) on Intelipost. Retrying...`,
            },
            headers,
          );
        } else {
          break;
        }
      }

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
        await this.retryIntelipostIntegration({ headers, data, account });
        return;
      }
      if (isValidationError && existingOrderNumber && retry) {
        throw new Error(intelipostErrorKey);
      }

      if (response.status === 200) {
        this.logger.log(
          {
            key: 'ifc.freight.api.order.on-event-intellipost-controller.sendIntelipostData.success',
            message: `Order created successfully on Intelipost with orderSale: ${response?.data?.content?.sales_order_number} order: ${response?.data?.content?.order_number} and trackingUrl: ${response?.data?.content?.tracking_url}`,
          },
          headers,
        );

        const newOrders =
          this.intelipostMapper.mapResponseIntelipostToDeliveryHub(
            response.data.content,
            carrier,
            intelipostData.estimated_delivery_date,
          );

        const extra = account.storeCode
          ? {
              storeId: new Types.ObjectId(account.id),
              storeCode: account.storeCode,
              internalOrderId: data.order.internalOrderId,
            }
          : {};

        for await (const order of newOrders) {
          await this.intelipostService.intelipost(order, headers, extra);
        }
        await this.invoiceService.updateStatus(
          data.key,
          data.order.externalOrderId,
          InvoiceStatusEnum.SUCCESS,
          null,
        );
        return;
      }

      throw new Error(JSON.stringify(response?.data));
    } catch (error) {
      this.logger.error(
        new Error(
          `Error message: '${error.message}'. OrderSale: ${data.order.externalOrderId} order: ${data.order.internalOrderId} invoice key: ${data.key} and status: ${InvoiceStatusEnum.ERROR}`,
        ),
      );
      await this.invoiceService.updateStatus(
        data.key,
        data.order.externalOrderId,
        InvoiceStatusEnum.ERROR,
        error,
      );
    }
  }

  private async retryIntelipostIntegration({
    headers,
    data,
    account,
  }): Promise<void> {
    const newData = {
      ...data,
      order: {
        ...data.order,
        internalOrderId: `${data.order.internalOrderId}-${data.number}`,
      },
    };
    this.logger.log(
      {
        key: 'ifc.freight.api.order.on-event-intellipost-controller.retryIntelipostIntegration',
        message: `OrderSale (${data.order.externalOrderId}) Order (${data.order.internalOrderId}) already exists on Intelipost. Retrying with the new orderNumber: ${newData.order.internalOrderId}`,
      },
      headers,
    );
    await this.sendIntelipostData({
      headers,
      data: newData,
      account,
      retry: true,
    });
  }
}
