import { Controller, UseGuards, Get, Inject, Request } from '@nestjs/common';
import { LogProvider } from '@infralabs/infra-logger';
import { RequestDto } from 'src/commons/dtos/request.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JWTGuard } from '../commons/guards/jwt.guard';
import { StoreService } from './store.service';

@Controller('stores')
@ApiTags('Stores')
@ApiBearerAuth()
export class StoreController {
  constructor(
    private readonly storesService: StoreService,
    @Inject('LogProvider') private logger: LogProvider,
  ) {
    this.logger.context = 'StoreController';
  }

  @Get()
  @UseGuards(JWTGuard)
  async getStores(@Request() req: RequestDto) {
    const { tenants } = req;
    const response = await this.storesService.findStoresOfUser(tenants);
    this.logger.log(
      JSON.stringify({
        message: `Request received from ${req.email}`,
        data: `Payload: ${JSON.stringify(response)}`,
      }),
    );
    return response;
  }
}
