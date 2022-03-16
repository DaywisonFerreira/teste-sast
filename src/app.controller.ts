import { InfraLogger } from '@infralabs/infra-logger';
import { Controller, Get, Headers } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('health')
@ApiTags('health')
export class AppController {
  @Get()
  health(@Headers() headers: any) {
    const logger = new InfraLogger(headers, AppController.name);
    logger.log('ok');
    return { message: 'OK', noIntercept: true };
  }
}
