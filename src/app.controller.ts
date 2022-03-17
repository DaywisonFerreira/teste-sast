import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('health')
@ApiTags('health')
export class AppController {
  @Get()
  health() {
    return { message: 'OK', noIntercept: true };
  }
}
