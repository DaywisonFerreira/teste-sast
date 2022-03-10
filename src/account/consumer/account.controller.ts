import {
  KafkaResponse,
  KafkaService,
  SubscribeTopic,
} from '@infralabs/infra-nestjs-kafka';
import { InfraLogger } from '@infralabs/infra-logger';
import { Controller, Inject } from '@nestjs/common';
import { Env } from 'src/commons/environment/env';
import { AccountService } from '../account.service';

@Controller()
export class ConsumerAccountController {
  constructor(
    private readonly accountService: AccountService,
    @Inject('KafkaService') private kafkaProducer: KafkaService,
  ) {}

  @SubscribeTopic(Env.KAFKA_TOPIC_ACCOUNT_CREATED)
  async createAccount({
    value,
    partition,
    headers,
    offset,
  }: KafkaResponse<string>) {
    const logger = new InfraLogger(headers, ConsumerAccountController.name);
    const data = JSON.parse(value);

    try {
      logger.log('account.created - Account consumer was received');
      await this.accountService.create(data.data);
    } catch (error) {
      logger.error(error);
    } finally {
      await this.removeFromQueue(
        Env.KAFKA_TOPIC_ACCOUNT_CREATED,
        partition,
        offset,
      );
    }
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_ACCOUNT_CHANGED)
  async updateAccount({
    value,
    partition,
    headers,
    offset,
  }: KafkaResponse<string>) {
    const logger = new InfraLogger(headers, ConsumerAccountController.name);
    const data = JSON.parse(value);

    try {
      logger.log('account.changed - Account consumer was received');
      await this.accountService.update(data.data.id, data.data);
    } catch (error) {
      logger.error(error);
    } finally {
      await this.removeFromQueue(
        Env.KAFKA_TOPIC_ACCOUNT_CHANGED,
        partition,
        offset,
      );
    }
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_ACCOUNT_LOCATION_CREATED)
  async createLocation({
    value,
    partition,
    headers,
    offset,
  }: KafkaResponse<string>) {
    const logger = new InfraLogger(headers, ConsumerAccountController.name);
    const data = JSON.parse(value);

    try {
      logger.log('location.created - Account consumer was received');
      await this.accountService.create(data.data);
    } catch (error) {
      logger.error(error);
    } finally {
      await this.removeFromQueue(
        Env.KAFKA_TOPIC_ACCOUNT_LOCATION_CREATED,
        partition,
        offset,
      );
    }
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_ACCOUNT_LOCATION_CHANGED)
  async updateLocation({
    value,
    partition,
    headers,
    offset,
  }: KafkaResponse<string>) {
    const logger = new InfraLogger(headers, ConsumerAccountController.name);
    const data = JSON.parse(value);

    try {
      logger.log('location.changed - Account consumer was received');
      await this.accountService.update(data.data.id, data.data);
    } catch (error) {
      logger.error(error);
    } finally {
      await this.removeFromQueue(
        Env.KAFKA_TOPIC_ACCOUNT_LOCATION_CHANGED,
        partition,
        offset,
      );
    }
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_ACCOUNT_LOCATION_ASSOCIATED)
  async locationAssociated({
    value,
    partition,
    headers,
    offset,
  }: KafkaResponse<string>) {
    const logger = new InfraLogger(headers, ConsumerAccountController.name);
    const data = JSON.parse(value);

    try {
      logger.log(
        `location.associated - Account consumer was received ${data.data.id}`,
      );
      await this.accountService.associateLocation(
        headers['X-Tenant-Id'],
        data.data.id,
      );
    } catch (error) {
      logger.error(error);
    } finally {
      await this.removeFromQueue(
        Env.KAFKA_TOPIC_ACCOUNT_LOCATION_ASSOCIATED,
        partition,
        offset,
      );
    }
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_ACCOUNT_LOCATION_UNASSOCIATED)
  async locationUnassociated({
    value,
    partition,
    headers,
    offset,
  }: KafkaResponse<string>) {
    const logger = new InfraLogger(headers, ConsumerAccountController.name);
    const data = JSON.parse(value);

    try {
      logger.log(
        `location.unassociated - Account consumer was received ${data.data.id}`,
      );

      await this.accountService.unassociateLocation(
        headers['X-Tenant-Id'],
        data.data.id,
      );
    } catch (error) {
      logger.error(error);
    } finally {
      await this.removeFromQueue(
        Env.KAFKA_TOPIC_ACCOUNT_LOCATION_UNASSOCIATED,
        partition,
        offset,
      );
    }
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
