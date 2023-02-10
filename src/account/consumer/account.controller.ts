import {
  KafkaResponse,
  KafkaService,
  SubscribeTopic,
} from '@infralabs/infra-nestjs-kafka';
import { Controller, Inject } from '@nestjs/common';
import { Env } from 'src/commons/environment/env';
import { LogProvider } from 'src/commons/providers/log/log-provider.interface';
import { AccountService } from '../account.service';

@Controller()
export class ConsumerAccountController {
  constructor(
    private readonly accountService: AccountService,
    @Inject('KafkaService') private kafkaProducer: KafkaService,
    @Inject('LogProvider')
    private readonly logger: LogProvider,
  ) {
    this.logger.instanceLogger(ConsumerAccountController.name);
  }

  @SubscribeTopic(Env.KAFKA_TOPIC_ACCOUNT_CREATED)
  async createAccount({
    value,
    partition,
    headers,
    offset,
  }: KafkaResponse<string>) {
    const { data } = JSON.parse(value);
    try {
      this.logger.log(
        {
          key: 'ifc.freight.api.order.consumer-account-controller.createAccount',
          message: `${Env.KAFKA_TOPIC_ACCOUNT_CREATED} - Account consumer was received`,
        },
        headers,
      );
      await this.accountService.create(data);
    } catch (error) {
      this.logger.error(error);
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
    this.logger.log(
      {
        key: 'ifc.freight.api.order.consumer-account-controller.createAccount',
        message: `${Env.KAFKA_TOPIC_ACCOUNT_CHANGED} - Account consumer was received`,
      },
      headers,
    );
    const { data } = JSON.parse(value);
    try {
      await this.accountService.update(data.id, data);
    } catch (error) {
      this.logger.error(error);
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
    this.logger.log(
      {
        key: 'ifc.freight.api.order.consumer-account-controller.createAccount',
        message: `${Env.KAFKA_TOPIC_ACCOUNT_LOCATION_CREATED} - Account consumer was received`,
      },
      headers,
    );
    const { data } = JSON.parse(value);
    try {
      await this.accountService.create(data);
    } catch (error) {
      this.logger.error(error);
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
    this.logger.log(
      {
        key: 'ifc.freight.api.order.consumer-account-controller.createAccount',
        message: `${Env.KAFKA_TOPIC_ACCOUNT_LOCATION_CHANGED} - Account consumer was received`,
      },
      headers,
    );
    const { data } = JSON.parse(value);

    try {
      await this.accountService.update(data.id, data);
    } catch (error) {
      this.logger.error(error);
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
    const { data } = JSON.parse(value);
    this.logger.log(
      {
        key: 'ifc.freight.api.order.consumer-account-controller.createAccount',
        message: `${Env.KAFKA_TOPIC_ACCOUNT_LOCATION_ASSOCIATED} - Account consumer was received ${data.id}`,
      },
      headers,
    );
    try {
      await this.accountService.associateLocation(
        headers['X-Tenant-Id'],
        data.id,
      );
    } catch (error) {
      this.logger.error(error);
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
    const { data } = JSON.parse(value);
    this.logger.log(
      {
        key: 'ifc.freight.api.order.consumer-account-controller.createAccount',
        message: `${Env.KAFKA_TOPIC_ACCOUNT_LOCATION_UNASSOCIATED} - Account consumer was received ${data.id}`,
      },
      headers,
    );
    try {
      await this.accountService.unassociateLocation(
        headers['X-Tenant-Id'],
        data.id,
      );
    } catch (error) {
      this.logger.error(error);
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
