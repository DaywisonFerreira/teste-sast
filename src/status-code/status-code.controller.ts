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
      req.logger.verbose(`Request was received to get all statusCodes`);
      const statusCodes = await this.statusCodeService.getList();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return statusCodes;
    } catch (error) {
      req.logger.error(error);
      throw error;
    }
  }
}
