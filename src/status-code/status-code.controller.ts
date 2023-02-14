import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LogProvider } from 'src/commons/providers/log/log-provider.interface';
import { GetStatusCodeDto } from './dto/status-code.dto';
import { StatusCodeService } from './status-code.service';

@Controller('status-code')
@ApiTags('StatusCode')
export class StatusCodeController {
  constructor(
    private readonly statusCodeService: StatusCodeService,
    @Inject('LogProvider')
    private readonly logger: LogProvider,
  ) {
    this.logger.instanceLogger(StatusCodeController.name);
  }

  @Get('get-list')
  @ApiOkResponse({ type: [GetStatusCodeDto] })
  async getStatusCode(): Promise<Array<GetStatusCodeDto>> {
    try {
      this.logger.log(
        {
          key: 'ifc.freight.api.order.status-code-controller.getStatusCode',
          message: `Get all status codes`,
        },
        {},
      );
      return this.statusCodeService.getList();
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
