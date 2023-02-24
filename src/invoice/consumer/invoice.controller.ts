import {
  KafkaResponse,
  KafkaService,
  SubscribeTopic,
} from '@infralabs/infra-nestjs-kafka';
import { Controller, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AccountService } from 'src/account/account.service';
import { Account, DeliveryMethods } from 'src/carrier/schemas/carrier.schema';
import { v4 as uuidV4 } from 'uuid';
import { LogProvider } from 'src/commons/providers/log/log-provider.interface';
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
    @Inject('LogProvider')
    private readonly logger: LogProvider,
  ) {
    this.logger.instanceLogger(ConsumerInvoiceController.name);
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_INVOICE_CREATED)
  async create({ value, partition, offset, headers }: KafkaResponse<string>) {
    const { data } = this.parseValueFromQueue(value);
    try {
      const accountId = headers['X-Tenant-Id'];

      this.logger.log(
        {
          key: 'ifc.freight.api.order.consumer-invoice-controller.create',
          message: `${Env.KAFKA_TOPIC_INVOICE_CREATED} - Invoice was received with the orderSale: ${data.order.externalOrderId} order: ${data.order.internalOrderId}`,
        },
        {},
      );

      await this.generateIntegration(data, accountId, headers);
    } catch (error) {
      await this.setInvoiceStatusError(data, error);
      this.logger.error(
        new Error(
          `Error Invoice with the orderSale: ${data.order.externalOrderId} order: ${data.order.internalOrderId} key: ${data.key} -- errorMessage: ${error.message}`,
        ),
      );
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
    const { data, metadata } = this.parseValueFromQueue(value);
    const accountId = headers['X-Tenant-Id'];
    const invoice = await this.invoiceService.findById(data.id, accountId);
    try {
      this.logger.log(
        {
          key: 'ifc.freight.api.order.consumer-invoice-controller.integrated',
          message: `${Env.KAFKA_TOPIC_INVOICE_INTEGRATED} - Invoice was received with the orderSale: ${data.order.externalOrderId} order: ${data.order.internalOrderId}`,
        },
        {},
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
        null,
      );
    } catch (error) {
      await this.setInvoiceStatusError(invoice, error);
      this.logger.error(
        new Error(
          `Error integrated invoice - orderSale: ${data.order.externalOrderId}, order: ${data.order.internalOrderId}, invoiceKey: ${invoice.key} -- errorMessage: ${error.message}`,
        ),
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
    headers: { [key: string]: any },
    carrier: any,
    externalDeliveryMethods: DeliveryMethods[],
  ): Promise<void> {
    this.logger.log(
      {
        key: 'ifc.freight.api.order.consumer-invoice-controller.create',
        message: `Integrate invoice with key: ${data.key} and orderSale: ${data.order.externalOrderId}`,
      },
      {},
    );
    try {
      if (data.notfisFile && data.notfisFileName) {
        await this.invoiceService.sendFtp(data, accountId);
      }
      const account = await this.accountService.findById(accountId);
      const order = await this.orderService.findByKeyAndOrderSale(
        data.key,
        data.order.externalOrderId,
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

      if (order) {
        if (order.invoice?.deliveryMethod) {
          data.carrier.deliveryModeName = order.invoice?.deliveryMethod;
        }

        await this.kafkaProducer.send(
          Env.KAFKA_TOPIC_ORDER_CREATED,
          MessageOrderCreated({ data, accountId, headers }),
        );
      }

      if (!intelipostIntegrationIsOk) {
        const errorLog = `Order ${data.order.internalOrderId} orderSale ${data.order.externalOrderId} externalDeliveryMethodId or externalDeliveryMethods not found`;
        this.logger.log(
          {
            key: 'ifc.freight.api.order.consumer-invoice-controller.create-error',
            message: errorLog,
          },
          {},
        );
        if (!order) {
          await this.setInvoiceStatusPending(data);
        } else {
          await this.setInvoiceStatusError(data, errorLog);
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
    } catch (error) {
      const errorLog = `Error integrate invoice with key ${data.key} and orderSale: ${data.order.externalOrderId} -- errorMessage: ${error.message}`;
      this.logger.error(new Error(errorLog));
      throw new Error(errorLog);
    }
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_INTELIPOST_ORDER_COMPENSATOR)
  async intelipostOrderCompensator({
    value,
    partition,
    offset,
    headers,
  }: KafkaResponse<string>) {
    const { data } = JSON.parse(value);
    const invoice = await this.invoiceService.findById(data.id, data.accountId);

    try {
      this.logger.log(
        {
          key: 'ifc.freight.api.order.consumer-invoice-controller.intelipostOrderCompensator',
          message: `Reprocessing invoice - key: ${invoice.key} orderSale: ${invoice.order.externalOrderId} order: ${invoice.order.internalOrderId} status: ${invoice.status}`,
        },
        headers,
      );
      try {
        await this.generateIntegration(invoice, invoice.accountId, headers);
      } catch (error) {
        await this.setInvoiceStatusError(invoice, error);
        this.logger.error(
          new Error(
            `Error reprocessing invoice - key: ${invoice.key} orderSale: ${invoice.order.externalOrderId} order: ${invoice.order.internalOrderId} -- errorMessage: ${error.message}`,
          ),
        );
      }
    } catch (error) {
      this.logger.error(
        new Error(
          `Error integrated invoice - orderSale: ${data.order.externalOrderId}, order: ${data.order.internalOrderId}, invoiceKey: ${invoice.key} -- errorMessage: ${error.message}`,
        ),
      );
    } finally {
      await this.removeFromQueue(
        Env.KAFKA_TOPIC_INVOICE_INTEGRATED,
        partition,
        offset,
      );
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
        this.logger.log(
          {
            key: 'ifc.freight.api.order.consumer-invoice-controller.reprocess',
            message: `Reprocessing invoice - key: ${invoice.key} orderSale: ${invoice.order.externalOrderId} order: ${invoice.order.internalOrderId} status: ${invoice.status}`,
          },
          headers,
        );
        try {
          await this.generateIntegration(invoice, invoice.accountId, headers);
        } catch (error) {
          await this.setInvoiceStatusError(invoice, error);
          this.logger.error(
            new Error(
              `Error reprocessing invoice - key: ${invoice.key} orderSale: ${invoice.order.externalOrderId} order: ${invoice.order.internalOrderId} -- errorMessage: ${error.message}`,
            ),
          );
        }
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  private async generateIntegration(data, accountId, headers) {
    this.logger.log(
      {
        key: 'ifc.freight.api.order.consumer-invoice-controller.generateIntegration',
        message: `Generate integration - key: ${data.key} orderSale: ${data.order.externalOrderId} order: ${data.order.internalOrderId}`,
      },
      headers,
    );

    try {
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
        headers,
        carrier,
        deliveryMethods,
      );
    } catch (error) {
      const errorLog = `Error generate integration - key: ${data.key} orderSale: ${data.order.externalOrderId} order: ${data.order.internalOrderId} -- errorMessage: ${error.message}`;
      this.logger.error(new Error(errorLog));

      throw new Error(errorLog);
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
          const errorLog = `${Env.KAFKA_TOPIC_INVOICE_CREATED} - DeliveryMethod not found ${order.invoice?.deliveryMethod} in carrier with document: ${data.carrier.document} invoice ${InvoiceStatusEnum.ERROR}.`;
          await this.setInvoiceStatusError(data, errorLog);
          throw new Error(errorLog);
        }
        return deliveryMethod.externalDeliveryMethodId;
      }
    }
    return null;
  }

  private async setInvoiceStatusError(
    data: any,
    errorLog: any = null,
  ): Promise<void> {
    this.logger.log(
      {
        key: 'ifc.freight.api.order.consumer-invoice-controller.setInvoiceStatusError',
        message: `setInvoiceStatusError - key: ${data.key} orderSale: ${data.order.externalOrderId}`,
      },
      {},
    );
    await this.invoiceService.updateStatus(
      data.key,
      data.order.externalOrderId,
      InvoiceStatusEnum.ERROR,
      errorLog,
    );
  }

  private async setInvoiceStatusPending(data: any): Promise<void> {
    this.logger.log(
      {
        key: 'ifc.freight.api.order.consumer-invoice-controller.setInvoiceStatusError',
        message: `setInvoiceStatusPending - key: ${data.key} orderSale: ${data.order.externalOrderId}`,
      },
      {},
    );
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
