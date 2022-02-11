import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { ConsumeMessage, Channel } from 'amqplib';
import { IStore } from '../../config/interfaces';
import { ConfigService } from '../../config/config.service';
import { ConfigMapper } from '../../config/mappers/config.mapper';
import { Env } from '../../commons/environment/env';

@Injectable()
export class StoreNotificationHandler {
  constructor(
    private readonly configService: ConfigService,
    private readonly configMapper: ConfigMapper,
  ) {}

  @RabbitSubscribe({
    exchange: Env.STORE_NOTIFICATION_EXCHANGE,
    routingKey: '',
    queue: 'ifc_logistic_api_core_store_notification_q',
    errorHandler: (channel: Channel, msg: ConsumeMessage, error: Error) => {
      // eslint-disable-next-line no-console
      console.log(error);
      channel.reject(msg, false);
    },
  })
  public async storeNotificationHandler(store: IStore) {
    // eslint-disable-next-line no-console
    console.log(`Store ${store.code} was received`);

    try {
      const config = this.configMapper.mapStoreToConfig(store);
      await this.configService.merge(config);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error.message, { payload: JSON.stringify(store) });
    }
  }
}
