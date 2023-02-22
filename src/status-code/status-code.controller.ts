import { Controller, Get, Inject, Param, Response } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LogProvider } from 'src/commons/providers/log/log-provider.interface';
import {
  GetStatusCodeMacroDto,
  GetStatusCodeMicroDto,
} from './dto/status-code.dto';
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

  @Get('macro')
  @ApiOkResponse({ type: [GetStatusCodeMacroDto] })
  async getStatusCodeMacro(
    @Response() res,
  ): Promise<Array<GetStatusCodeMacroDto>> {
    try {
      this.logger.log({
        key: 'ifc.freight.api.order.status-code-controller.getStatusCodeMacro',
        message: `Get all status codes macro`,
      });
      const results = await this.statusCodeService.getStatusCodeMacroList();
      return res.send(
        results.map(result => GetStatusCodeMacroDto.factory(result as any)),
      );
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  @Get('macro/:code/micro')
  @ApiOkResponse({ type: [GetStatusCodeMicroDto] })
  async getStatusCodeMicro(
    @Param('code') code: string,
    @Response() res,
  ): Promise<Array<GetStatusCodeMicroDto>> {
    try {
      this.logger.log({
        key: 'ifc.freight.api.order.status-code-controller.getStatusCodeMicro',
        message: `Get all status codes micro of macro: ${code}`,
      });
      const results = await this.statusCodeService.getStatusCodeMicroList(code);
      return res.send(
        results.map(result => GetStatusCodeMicroDto.factory(result as any)),
      );
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
