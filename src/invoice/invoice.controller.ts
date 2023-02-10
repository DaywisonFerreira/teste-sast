import { Controller, Get, Inject, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RequestDto } from 'src/commons/dtos/request.dto';
import { JWTGuard } from 'src/commons/guards/jwt.guard';
import { NestjsEventEmitter } from 'src/commons/providers/event/nestjs-event-emitter';
import { LogProvider } from 'src/commons/providers/log/log-provider.interface';

@Controller('invoices')
@ApiTags('Invoices')
@ApiBearerAuth()
export class InvoiceController {
  constructor(
    private readonly eventEmitter: NestjsEventEmitter,
    @Inject('LogProvider')
    private readonly logger: LogProvider,
  ) {
    this.logger.instanceLogger(InvoiceController.name);
  }

  @Get('/reprocess')
  @UseGuards(JWTGuard)
  @ApiOkResponse()
  async reprocess(@Request() request: RequestDto): Promise<string> {
    this.logger.log(
      {
        key: 'ifc.freight.api.order.invoice-controller.reprocess',
        message: `Manual reprocess request from user: ${request.userId}`,
      },
      {},
    );
    try {
      this.eventEmitter.emit('invoice.reprocess', null);
      return 'ok';
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
