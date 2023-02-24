import { KafkaService } from '@infralabs/infra-nestjs-kafka';
import { Controller, Get, Inject } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LogProvider } from 'src/commons/providers/log/log-provider.interface';
import { MessageIntelipostToIntegrate } from 'src/intelipost/factories';
import { InvoiceStatusEnum } from 'src/invoice/enums/invoice-status-enum';
import { InvoiceService } from 'src/invoice/invoice.service';
import { InvoiceEntity } from 'src/invoice/schemas/invoice.schema';
import { Env } from '../commons/environment/env';

@Controller('jobs')
@ApiTags('Jobs')
@ApiBearerAuth()
export class JobsController {
  constructor(
    @Inject('LogProvider')
    private readonly logger: LogProvider,
    @Inject('KafkaService') private kafkaProducer: KafkaService,
    private readonly invoiceService: InvoiceService,
  ) {
    this.logger.instanceLogger(JobsController.name);
  }

  @Get('intelipost-order-integrate')
  @ApiOkResponse({ status: 200 })
  async intelipostOrderIntegrate(): Promise<void> {
    this.logger.log(
      {
        key: 'ifc.freight.api.order.jobs-controller.intelipostOrderIntegrate',
        message: `Starting to reprocess orders`,
      },
      {},
    );
    try {
      let invoices = [];
      invoices = await this.invoiceService.findByStatus([
        InvoiceStatusEnum.PENDING,
        InvoiceStatusEnum.ERROR,
      ]);
      if (invoices.length > 0) {
        this.produceInvoicesToIntegrate(invoices);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  private async produceInvoicesToIntegrate(
    invoices: InvoiceEntity[],
  ): Promise<void> {
    for (const payload of invoices) {
      await this.kafkaProducer.send(
        Env.KAFKA_TOPIC_INTELIPOST_ORDER_COMPENSATOR,
        MessageIntelipostToIntegrate(payload),
      );
    }
  }
}
