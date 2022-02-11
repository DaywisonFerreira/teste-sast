import {
  Controller,
  Post,
  Body,
  Inject,
  Headers,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LogProvider } from '@infralabs/infra-logger';
import { ApiTags } from '@nestjs/swagger';
import { InteliPostService } from './intelipost.service';
import { CreateIntelipost } from './dto/create-intelipost.dto';
import { Env } from '../commons/environment/env';

@Controller('intelipost')
@ApiTags('Intelipost')
export class InteliPostController {
  constructor(
    private readonly storesService: InteliPostService,
    @Inject('LogProvider') private logger: LogProvider,
  ) {
    this.logger.context = InteliPostController.name;
  }

  @Post()
  async postIntelipost(
    @Body() createIntelipost: CreateIntelipost,
    @Headers('authorization') auth: string,
  ) {
    try {
      const token = auth.split(' ')[1];
      const credentials = Buffer.from(
        `${Env.INTELIPOST_USERNAME}:${Env.INTELIPOST_PASSWORD}`,
      ).toString('base64');

      this.logger.log(
        JSON.stringify({
          message: `Request received from Intelipost`,
          data: JSON.stringify(createIntelipost),
        }),
      );

      if (credentials !== token) {
        this.logger.error(new Error('Username or password invalid'));

        throw new HttpException(
          'Username or password invalid',
          HttpStatus.UNAUTHORIZED,
        );
      }

      await this.storesService.inteliPost(createIntelipost, this.logger);
    } catch (error) {
      this.logger.error(error);

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
