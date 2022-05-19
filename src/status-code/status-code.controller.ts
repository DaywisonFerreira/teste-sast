import { Controller, Get, Req } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetStatusCodeDto } from './dto/status-code.dto';
import { StatusCodeService } from './status-code.service';

@Controller('status-code')
@ApiTags('StatusCode')
export class StatusCodeController {
  constructor(private readonly statusCodeService: StatusCodeService) {}

  @Get('get-list')
  @ApiOkResponse({ type: [GetStatusCodeDto] })
  async getStatusCode(@Req() req: any): Promise<Array<GetStatusCodeDto>> {
    try {
      return this.statusCodeService.getList();
    } catch (error) {
      req.logger.error(error);
      throw error;
    }
  }
}
