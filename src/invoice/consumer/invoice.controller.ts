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
import { MessageOrderCreated } from '../factories';

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

      const partnersAccounts = carrier?.partners?.intelipost?.accounts || [];

      const deliveryMethods = this.getDeliveryMethodsFromAccount(
        accountId,
        partnersAccounts,
      );
      if (!deliveryMethods.length) {
        data.carrier.externalDeliveryMethodId =
          carrier.externalDeliveryMethodId;
      }
      const deliveryMode = await this.getDeliveryMethodFromOrder(
        deliveryMethods,
        data,
      );

      if (deliveryMode?.externalDeliveryMethodId) {
        data.carrier.externalDeliveryMethodId =
          deliveryMode.externalDeliveryMethodId;
      }

      if (deliveryMode?.deliveryModeName) {
        data.carrier.deliveryModeName = deliveryMode.deliveryModeName;
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

  @SubscribeTopic(Env.KAFKA_TOPIC_INVOICE_INTEGRATED)
  async integrated({
    value,
    partition,
    offset,
    headers,
  }: KafkaResponse<string>) {
    const logger = new InfraLogger(headers, ConsumerInvoiceController.name);
    const { data, metadata } = this.parseValueFromQueue(value);
    const accountId = headers['X-Tenant-Id'];
    const invoice = await this.invoiceService.findById(data.id, accountId);
    try {
      logger.log(
        `${Env.KAFKA_TOPIC_INVOICE_INTEGRATED} - Invoice was received with the orderSale: ${data.order.externalOrderId} order: ${data.order.internalOrderId}`,
      );

      if (!invoice) {
        throw new Error(`Invoice not found with id ${data.id}`);
      }

      const newIntegration = {
        name: data?.integrationName.toLowerCase() ?? '',
        status: data?.status,
        errorMessage: data?.errorMessage ?? '',
        createdAt: new Date(metadata?.createdAt),
      };

      await this.orderService.updateIntegrations(
        { 'invoice.key': invoice.key },
        invoice,
        newIntegration,
      );

      let status = null;
      if (newIntegration.status === 'done') {
        status = InvoiceStatusEnum.SUCCESS;
      } else {
        status = newIntegration.status;
      }

      await this.invoiceService.updateStatus(
        invoice.key,
        data.order.externalOrderId,
        status,
      );
    } catch (error) {
      logger.log(
        `Error integrated invoice - orderSale: ${data.order.externalOrderId}, order: ${data.order.internalOrderId}, ${error}`,
      );
    } finally {
      await this.removeFromQueue(
        Env.KAFKA_TOPIC_INVOICE_INTEGRATED,
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
    const account = await this.accountService.findById(accountId);
    const order = await this.orderService.findByKeyAndOrderSale(
      data.key,
      data.order.externalOrderId,
    );

    await this.orderService.updateOrderInvoiceData(
      data.key,
      data.order.externalOrderId,
      data.trackingUrl,
      data.carrier.name,
      data.packages[0].trackingCode,
    );

    const deliveryMethodEnableToIntelipost = externalDeliveryMethods.find(
      deliveryMethod =>
        order.invoice?.deliveryMethod.toLowerCase() ===
          deliveryMethod.deliveryModeName.toLowerCase() &&
        deliveryMethod?.active,
    );

    const accountEnableToIntelipost =
      carrier?.partners?.intelipost?.accounts.find(
        acc => acc.id === accountId && acc.integrateIntelipost,
      );

    const intelipostIntegrationIsOk =
      order && deliveryMethodEnableToIntelipost && accountEnableToIntelipost;

    const payload = {
      ...data,
      carrier: {
        ...data.carrier,
        externalDeliveryMethodId:
          deliveryMethodEnableToIntelipost?.externalDeliveryMethodId,
        deliveryModeName: deliveryMethodEnableToIntelipost?.deliveryModeName,
      },
    };

    await this.kafkaProducer.send(
      Env.KAFKA_TOPIC_ORDER_CREATED,
      MessageOrderCreated({ data, accountId, headers }),
    );

    if (!intelipostIntegrationIsOk) {
      logger.log(
        `Order ${data.order.internalOrderId} orderSale ${data.order.externalOrderId} externalDeliveryMethodId or externalDeliveryMethods not found`,
      );
      if (!order) {
        await this.setInvoiceStatusPending(data);
      } else {
        await this.setInvoiceStatusError(data);
      }
      return;
    }

    if (intelipostIntegrationIsOk) {
      this.eventEmitter.emit('intelipost.sent', {
        headers,
        data: payload,
        account,
      });
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

          const partnersAccounts =
            carrier?.partners?.intelipost?.accounts || [];

          const deliveryMethods = this.getDeliveryMethodsFromAccount(
            invoice.accountId,
            partnersAccounts,
          );
          if (!deliveryMethods.length) {
            invoice.carrier.externalDeliveryMethodId =
              carrier?.externalDeliveryMethodId;
          }
          const deliveryMode = await this.getDeliveryMethodFromOrder(
            deliveryMethods,
            invoice,
          );

          if (deliveryMode?.externalDeliveryMethodId) {
            invoice.carrier.externalDeliveryMethodId =
              deliveryMode.externalDeliveryMethodId;
          }

          if (deliveryMode?.deliveryModeName) {
            invoice.carrier.deliveryModeName = deliveryMode.deliveryModeName;
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
            `Error reprocessing invoice - key: ${invoice.key} orderSale: ${invoice.order.externalOrderId} order: ${invoice.order.internalOrderId}. ${error}`,
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
  ): Promise<any | null> {
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
        return deliveryMethod;
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
