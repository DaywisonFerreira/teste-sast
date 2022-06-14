import {
  Body,
  Controller,
  Headers,
  HttpException,
  HttpStatus,
  Inject,
  Req,
  Post,
} from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';
import { KafkaService } from '@infralabs/infra-nestjs-kafka';
import { CreateIntelipost } from './dto/create-intelipost.dto';
import { Env } from '../commons/environment/env';
import { MessageIntelipostCreated } from './factories';

@Controller('intelipost')
@ApiTags('Intelipost')
export class IntelipostController {
  constructor(@Inject('KafkaService') private kafkaProducer: KafkaService) {}

  @Post()
  async postIntelipost(
    @Headers() headers: any,
    @Body() createIntelipost: CreateIntelipost,
    @Req() req: any,
  ) {
    try {
      req.logger.verbose(
        `Intelipost request received for orderSale: ${createIntelipost.sales_order_number} order: ${createIntelipost.order_number}`,
      );

      await this.kafkaProducer.send(
        Env.KAFKA_TOPIC_INTELIPOST_CREATED,
        MessageIntelipostCreated({
          createIntelipost,
          headers,
        }),
      );
    } catch (error) {
      req.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
