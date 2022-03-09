import {
  Controller,
  Post,
  Body,
  Inject,
  HttpException,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { LogProvider } from '@infralabs/infra-logger';

import { ApiTags } from '@nestjs/swagger';
import { KafkaService } from '@infralabs/infra-nestjs-kafka';
import { CreateIntelipost } from './dto/create-intelipost.dto';
import { Env } from '../commons/environment/env';
import { MessageIntelipostCreated } from './factories';

@Controller('intelipost')
@ApiTags('Intelipost')
export class InteliPostController {
  constructor(
    @Inject('LogProvider') private logger: LogProvider,
    @Inject('KafkaService') private kafkaProducer: KafkaService,
  ) {
    this.logger.context = InteliPostController.name;
  }

  @Post()
  async postIntelipost(
    @Headers() headers: any,
    @Body() createIntelipost: CreateIntelipost,
  ) {
    try {
      await this.kafkaProducer.send(
        Env.KAFKA_TOPIC_INTELIPOST_CREATED,
        MessageIntelipostCreated({
          createIntelipost,
          headers,
        }),
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
