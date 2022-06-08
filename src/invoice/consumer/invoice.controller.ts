import {
  KafkaResponse,
  KafkaService,
  SubscribeTopic,
} from '@infralabs/infra-nestjs-kafka';
import { Inject, Controller } from '@nestjs/common';

import { InfraLogger } from '@infralabs/infra-logger';
import { AccountService } from 'src/account/account.service';
import { CarrierEntity } from 'src/carrier/schemas/carrier.schema';
import { v4 as uuidV4 } from 'uuid';
import { OnEvent } from '@nestjs/event-emitter';
import { NestjsEventEmitter } from '../../commons/providers/event/nestjs-event-emitter';
import { Env } from '../../commons/environment/env';
import { InvoiceService } from '../invoice.service';
import { OrderService } from '../../order/order.service';
import { CarrierService } from '../../carrier/carrier.service';
import { InvoiceStatusEnum } from '../enums/invoice-status-enum';

@Controller()
export class ConsumerInvoiceController {
  constructor(
    private readonly accountService: AccountService,
    private readonly eventEmitter: NestjsEventEmitter,
    private readonly invoiceService: InvoiceService,
    private readonly orderService: OrderService,
    private readonly carrierService: CarrierService,
    @Inject('KafkaService') private kafkaProducer: KafkaService,
  ) {}

  @SubscribeTopic(Env.KAFKA_TOPIC_INVOICE_CREATED)
  async create({ value, partition, offset, headers }: KafkaResponse<string>) {
    const logger = new InfraLogger(headers, ConsumerInvoiceController.name);
    try {
      const { data } = this.parseValueFromQueue(value);
      const accountId = headers['X-Tenant-Id'];

      logger.log(
        `${Env.KAFKA_TOPIC_INVOICE_CREATED} - Invoice was received with the OrderSale ${data.order.externalOrderId}`,
      );

      const carrier = await this.carrierService.findByDocument(
        data.carrier.document,
      );

      if (!carrier?.externalDeliveryMethods) {
        data.carrier.externalDeliveryMethodId =
          carrier.externalDeliveryMethodId;
      }
      const externalDeliveryMethodId = await this.getDeliveryMethodFromOrder(
        carrier,
        data,
      );
      if (externalDeliveryMethodId) {
        data.carrier.externalDeliveryMethodId = externalDeliveryMethodId;
      }

      await this.integrateInvoice(data, accountId, logger, headers, carrier);
    } catch (error) {
      logger.error(error);
    } finally {
      await this.removeFromQueue(
        Env.KAFKA_TOPIC_INVOICE_CREATED,
        partition,
        offset,
      );
    }
  }

  private async integrateInvoice(
    data: any,
    accountId: any,
    logger: InfraLogger,
    headers: { [key: string]: any },
    carrier: any,
  ): Promise<void> {
    if (data.notfisFile && data.notfisFileName) {
      await this.invoiceService.sendFtp(data, accountId, logger);
    }

    const account = await this.accountService.findOne(accountId);
    const intelipostIntegrationIsNotOk =
      account.integrateIntelipost &&
      (!carrier?.externalDeliveryMethodId || !carrier?.externalDeliveryMethods);

    if (intelipostIntegrationIsNotOk) {
      logger.log({
        consumer: Env.KAFKA_TOPIC_INVOICE_CREATED,
        intelipostIntegrationIsNotOk,
        info: 'externalDeliveryMethodId and externalDeliveryMethods not found',
        carrier: {
          externalDeliveryMethodId: carrier?.externalDeliveryMethodId,
          externalDeliveryMethods: carrier?.externalDeliveryMethodIs,
        },
        integrateIntelipost: account.integrateIntelipost,
      });
      await this.setInvoiceStatusError(data);
      return;
    }

    if (account.integrateIntelipost) {
      this.eventEmitter.emit('intelipost.sent', { headers, data });
    }
  }

  @OnEvent('invoice.reprocess', { async: true })
  async reprocess(): Promise<void> {
    const headers = {
      'X-Correlation-Id': uuidV4(),
      'X-Version': '1.0',
    };
    const logger = new InfraLogger(headers, ConsumerInvoiceController.name);
    try {
      const invoices: any[] = await this.invoiceService.findByStatus([
        InvoiceStatusEnum.PENDING,
        InvoiceStatusEnum.ERROR,
      ]);

      for await (const invoice of invoices) {
        const carrier = await this.carrierService.findByDocument(
          invoice.carrier.document,
        );
        const externalDeliveryMethodId = await this.getDeliveryMethodFromOrder(
          carrier,
          invoice,
        );
        if (externalDeliveryMethodId) {
          invoice.carrier.externalDeliveryMethodId = externalDeliveryMethodId;
          await this.invoiceService.updateStatus(
            invoice.key,
            invoice.order.internalOrderId,
            InvoiceStatusEnum.SUCCESS,
          );
        }
        await this.integrateInvoice(
          invoice,
          invoice.accountId,
          logger,
          headers,
          carrier,
        );
      }
    } catch (error) {
      logger.error(error);
    }
  }

  private parseValueFromQueue(value: string) {
    const data = JSON.parse(value);

    return data;
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

  private async getDeliveryMethodFromOrder(
    carrier: CarrierEntity,
    data: any,
  ): Promise<string | null> {
    if (carrier?.externalDeliveryMethods?.length) {
      const order = await this.orderService.findByKeyAndInternalOrderId(
        data.key,
        data.order.externalOrderId,
      );

      if (!order) {
        await this.invoiceService.updateStatus(
          data.key,
          data.order.externalOrderId,
          InvoiceStatusEnum.PENDING,
        );
        throw new Error(
          `${Env.KAFKA_TOPIC_INVOICE_CREATED} - Order not found filter: key: ${data.key}, OrderSale: ${data.order.externalOrderId} invoice ${InvoiceStatusEnum.PENDING}.`,
        );
      }
      const carrierdeliveryMethods = carrier?.externalDeliveryMethods;

      if (carrierdeliveryMethods) {
        const deliveryMethod = carrierdeliveryMethods.find(
          item => order.invoice?.deliveryMethod === item.deliveryModeName,
        );
        if (!deliveryMethod) {
          await this.setInvoiceStatusError(data);
          throw new Error(
            `${Env.KAFKA_TOPIC_INVOICE_CREATED} - DeliveryMethod not found ${order.invoice?.deliveryMethod} in carrier with document: ${carrier.document} invoice ${InvoiceStatusEnum.ERROR}.`,
          );
        }
        return deliveryMethod.externalDeliveryMethodId;
      }
    }
    return null;
  }

  private async setInvoiceStatusError(data: any): Promise<void> {
    await this.invoiceService.updateStatus(
      data.key,
      data.order.externalOrderId,
      InvoiceStatusEnum.ERROR,
    );
  }
}
