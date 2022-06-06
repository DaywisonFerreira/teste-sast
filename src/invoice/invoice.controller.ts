import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RequestDto } from 'src/commons/dtos/request.dto';
import { JWTGuard } from 'src/commons/guards/jwt.guard';
import { NestjsEventEmitter } from 'src/commons/providers/event/nestjs-event-emitter';

@Controller('invoices')
@ApiTags('Invoices')
@ApiBearerAuth()
export class InvoiceController {
  constructor(private readonly eventEmitter: NestjsEventEmitter) {}

  @Get('/reprocess')
  @UseGuards(JWTGuard)
  @ApiOkResponse()
  async reprocess(@Request() request: RequestDto): Promise<string> {
    const { logger } = request;
    try {
      this.eventEmitter.emit('invoice.reprocess', {});
      return 'ok';
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }
}
