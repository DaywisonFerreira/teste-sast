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
import { OnEvent } from '@nestjs/event-emitter';
import axios, { AxiosRequestConfig } from 'axios';
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

  @OnEvent('ftp.sent')
  async sendIntelipostData(data: any) {
    try {
      const apiKey = Env.INTELIPOST_SHIPMENT_ORDER_APIKEY;
      const platform = Env.INTELIPOST_SHIPMENT_ORDER_PLATFORM;
      const config: AxiosRequestConfig = {
        headers: {
          'APi-key': apiKey,
          platform,
        },
      };
      const response = await axios.post(
        Env.INTELIPOST_SHIPMENT_ORDER_ENDPOINT,
        data,
        config,
      );
      if (response.status === 200) {
        this.logger.log(
          JSON.stringify({
            message: 'Intelipost - Shipping order successfully completed!',
            data: response.data,
          }),
        );
      }
    } catch (error) {
      this.logger.log(
        JSON.stringify({
          error: error.message,
          message: error?.response?.data?.messages,
        }),
      );
    }
  }
}
