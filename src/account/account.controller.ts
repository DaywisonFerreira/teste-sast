import {
  KafkaResponse,
  KafkaService,
  SubscribeTopic,
} from '@infralabs/infra-nestjs-kafka';
import { Controller, Inject, Logger } from '@nestjs/common';
import { Env } from 'src/commons/environment/env';
import { AccountService } from './account.service';

@Controller()
export class AccountController {
  private logger = new Logger(AccountController.name);

  constructor(
    private readonly accountService: AccountService,
    @Inject('KafkaService') private kafkaProducer: KafkaService,
  ) {}

  @SubscribeTopic(Env.KAFKA_TOPIC_ACCOUNT_CREATED)
  async createAccount(messageKafka: KafkaResponse<string>) {
    const value = JSON.parse(messageKafka.value);

    await this.removeFromQueue(
      Env.KAFKA_TOPIC_ACCOUNT_CREATED,
      messageKafka.partition,
      messageKafka.offset,
    );

    this.logger.log('account.created - Account consumer was received');
    await this.accountService.create(value.data);
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_ACCOUNT_CHANGED)
  async updateAccount(messageKafka: KafkaResponse<string>) {
    const value = JSON.parse(messageKafka.value);

    await this.removeFromQueue(
      Env.KAFKA_TOPIC_ACCOUNT_CHANGED,
      messageKafka.partition,
      messageKafka.offset,
    );
    this.logger.log('account.changed - Account consumer was received');
    await this.accountService.update(value.data.id, value.data);
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_ACCOUNT_LOCATION_CREATED)
  async createLocation(messageKafka: KafkaResponse<string>) {
    const value = JSON.parse(messageKafka.value);

    await this.removeFromQueue(
      Env.KAFKA_TOPIC_ACCOUNT_LOCATION_CREATED,
      messageKafka.partition,
      messageKafka.offset,
    );
    this.logger.log('location.created - Account consumer was received');
    await this.accountService.create(value.data);
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_ACCOUNT_LOCATION_CHANGED)
  async updateLocation(messageKafka: KafkaResponse<string>) {
    const value = JSON.parse(messageKafka.value);

    await this.removeFromQueue(
      Env.KAFKA_TOPIC_ACCOUNT_LOCATION_CHANGED,
      messageKafka.partition,
      messageKafka.offset,
    );
    this.logger.log('location.changed - Account consumer was received');
    await this.accountService.update(value.data.id, value.data);
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_ACCOUNT_LOCATION_ASSOCIATED)
  async locationAssociated(messageKafka: KafkaResponse<string>) {
    const value = JSON.parse(messageKafka.value);
    const { headers } = messageKafka;

    await this.removeFromQueue(
      Env.KAFKA_TOPIC_ACCOUNT_LOCATION_ASSOCIATED,
      messageKafka.partition,
      messageKafka.offset,
    );
    this.logger.log(
      `location.associated - Account consumer was received ${value.data.id}`,
    );
    await this.accountService.associateLocation(
      headers['X-Tenant-Id'],
      value.data.id,
    );
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_ACCOUNT_LOCATION_UNASSOCIATED)
  async locationUnassociated(messageKafka: KafkaResponse<string>) {
    const value = JSON.parse(messageKafka.value);
    const { headers } = messageKafka;

    await this.removeFromQueue(
      Env.KAFKA_TOPIC_ACCOUNT_LOCATION_UNASSOCIATED,
      messageKafka.partition,
      messageKafka.offset,
    );
    this.logger.log(
      `location.unassociated - Account consumer was received ${value.data.id}`,
    );

    await this.accountService.unassociateLocation(
      headers['X-Tenant-Id'],
      value.data.id,
    );
  }

  private async removeFromQueue(
    topic: string,
    partition: number,
    offset: number,
  ) {
    await this.kafkaProducer.commitOffsets([
      {
        topic,
        partition,
        offset: String(offset + 1),
      },
    ]);
  }
}
