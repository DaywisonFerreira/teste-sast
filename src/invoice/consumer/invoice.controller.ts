import {
  KafkaResponse,
  KafkaService,
  SubscribeTopic,
} from '@infralabs/infra-nestjs-kafka';
import { Controller, Inject } from '@nestjs/common';

import { InfraLogger } from '@infralabs/infra-logger';
import { OnEvent } from '@nestjs/event-emitter';
import { AccountService } from 'src/account/account.service';
import { Account, DeliveryMethods } from 'src/carrier/schemas/carrier.schema';
import { v4 as uuidV4 } from 'uuid';
import { CarrierService } from '../../carrier/carrier.service';
import { Env } from '../../commons/environment/env';
import { NestjsEventEmitter } from '../../commons/providers/event/nestjs-event-emitter';
import { OrderService } from '../../order/order.service';
import { InvoiceStatusEnum } from '../enums/invoice-status-enum';
import { InvoiceService } from '../invoice.service';

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
        `${Env.KAFKA_TOPIC_INVOICE_CREATED} - Invoice was received with the orderSale: ${data.order.externalOrderId} order: ${data.order.internalOrderId}`,
      );

      const carrier = await this.carrierService.findByDocument(
        data.carrier.document,
      );

      const partnersAccounts = carrier?.partners?.intelipost?.accounts;

      const deliveryMethods = this.getDeliveryMethodsFromAccount(
        accountId,
        partnersAccounts,
      );
      if (!deliveryMethods.length) {
        data.carrier.externalDeliveryMethodId =
          carrier.externalDeliveryMethodId;
      }
      const externalDeliveryMethodId = await this.getDeliveryMethodFromOrder(
        deliveryMethods,
        data,
      );
      if (externalDeliveryMethodId) {
        data.carrier.externalDeliveryMethodId = externalDeliveryMethodId;
      }

      await this.integrateInvoice(
        data,
        accountId,
        logger,
        headers,
        carrier,
        deliveryMethods,
      );
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
    externalDeliveryMethods: DeliveryMethods[],
  ): Promise<void> {
    if (data.notfisFile && data.notfisFileName) {
      await this.invoiceService.sendFtp(data, accountId, logger);
    }
    const account = await this.accountService.findOne(accountId);
    const order = await this.orderService.findByKeyAndOrderSale(
      data.key,
      data.order.externalOrderId,
    );
    const intelipostIntegrationIsOk =
      order &&
      account.integrateIntelipost &&
      (carrier?.externalDeliveryMethodId || externalDeliveryMethods.length);

    if (!intelipostIntegrationIsOk) {
      logger.log({
        consumer: Env.KAFKA_TOPIC_INVOICE_CREATED,
        intelipostIntegrationIsOk,
        info: 'externalDeliveryMethodId or externalDeliveryMethods not found',
        carrier: {
          document: carrier?.document,
          externalDeliveryMethodId: carrier?.externalDeliveryMethodId,
          externalDeliveryMethods,
        },
        account: {
          id: accountId,
          integrateIntelipost: account?.integrateIntelipost,
        },
      });
      if (!order) {
        await this.setInvoiceStatusPending(data);
      } else {
        await this.setInvoiceStatusError(data);
      }
      return;
    }

    if (intelipostIntegrationIsOk) {
      this.eventEmitter.emit('intelipost.sent', { headers, data, account });
    }
  }

  @OnEvent('invoice.reprocess', { async: true })
  async reprocess(filter?: {
    key: string;
    externalOrderId: string;
  }): Promise<void> {
    const headers = {
      'X-Correlation-Id': uuidV4(),
      'X-Version': '1.0',
    };
    const logger = new InfraLogger(headers, ConsumerInvoiceController.name);
    try {
      let invoices = [];
      if (filter) {
        invoices = await this.invoiceService.findByStatusAndOrderFilter(
          [InvoiceStatusEnum.PENDING, InvoiceStatusEnum.ERROR],
          filter,
        );
      } else {
        invoices = await this.invoiceService.findByStatus([
          InvoiceStatusEnum.PENDING,
          InvoiceStatusEnum.ERROR,
        ]);
      }

      for await (const invoice of invoices) {
        logger.log(
          `reprocessing invoice - key: ${invoice.key} orderSale: ${invoice.order.externalOrderId} order: ${invoice.order.internalOrderId} status: ${invoice.status}`,
        );
        try {
          const carrier = await this.carrierService.findByDocument(
            invoice.carrier.document,
          );

          const partnersAccounts = carrier?.partners?.intelipost?.accounts;

          const deliveryMethods = this.getDeliveryMethodsFromAccount(
            invoice.accountId,
            partnersAccounts,
          );
          if (!deliveryMethods.length) {
            invoice.carrier.externalDeliveryMethodId =
              carrier.externalDeliveryMethodId;
          }
          const externalDeliveryMethodId =
            await this.getDeliveryMethodFromOrder(deliveryMethods, invoice);
          if (externalDeliveryMethodId) {
            invoice.carrier.externalDeliveryMethodId = externalDeliveryMethodId;
          }

          await this.integrateInvoice(
            invoice,
            invoice.accountId,
            logger,
            headers,
            carrier,
            deliveryMethods,
          );
        } catch (error) {
          logger.log(
            `Error reprocessing invoice - key: ${invoice.key} orderSale: ${invoice.order.externalOrderId} order: ${invoice.order.internalOrderId}`,
          );
        }
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
    deliveryMethods: DeliveryMethods[],
    data: any,
  ): Promise<string | null> {
    if (deliveryMethods?.length) {
      const order = await this.orderService.findByKeyAndOrderSale(
        data.key,
        data.order.externalOrderId,
      );
      if (!order) {
        await this.setInvoiceStatusPending(data);
        throw new Error(
          `${Env.KAFKA_TOPIC_INVOICE_CREATED} - Order not found filter: key: ${data.key}, OrderSale: ${data.order.externalOrderId} invoice ${InvoiceStatusEnum.PENDING}.`,
        );
      }
      if (deliveryMethods?.length) {
        const deliveryMethod = deliveryMethods.find(
          item => order.invoice?.deliveryMethod === item.deliveryModeName,
        );
        if (!deliveryMethod) {
          await this.setInvoiceStatusError(data);
          throw new Error(
            `${Env.KAFKA_TOPIC_INVOICE_CREATED} - DeliveryMethod not found ${order.invoice?.deliveryMethod} in carrier with document: ${data.carrier.document} invoice ${InvoiceStatusEnum.ERROR}.`,
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

  private async setInvoiceStatusPending(data: any): Promise<void> {
    await this.invoiceService.updateStatus(
      data.key,
      data.order.externalOrderId,
      InvoiceStatusEnum.PENDING,
    );
  }

  private getDeliveryMethodsFromAccount(
    accountId: string,
    accounts: Account[],
  ): DeliveryMethods[] {
    const account = accounts.find(account => account.id === accountId);
    if (account) return account?.externalDeliveryMethods || [];
    return [];
  }
}
