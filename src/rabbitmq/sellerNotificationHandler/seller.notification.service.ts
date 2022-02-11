import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConsumeMessage, Channel } from 'amqplib';
import { ISeller } from '../../config/interfaces';
import { ConfigService } from '../../config/config.service';
import { ConfigMapper } from '../../config/mappers/config.mapper';
import { Env } from '../../commons/environment/env';

@Injectable()
export class SellerNotificationHandler {
  constructor(
    private readonly configService: ConfigService,
    private readonly configMapper: ConfigMapper,
  ) {}

  @RabbitSubscribe({
    exchange: Env.SELLER_NOTIFICATION_EXCHANGE,
    routingKey: '',
    queue: 'ifc_logistic_api_core_seller_notification_q',
    errorHandler: (channel: Channel, msg: ConsumeMessage, error: Error) => {
      // eslint-disable-next-line no-console
      console.log(error);
      channel.reject(msg, false);
    },
  })
  public async sellerNotificationHandler(seller: ISeller) {
    // eslint-disable-next-line no-console
    console.log(`Seller ${seller.code} was received`);

    try {
      const storeConfig = await this.configService.findStoreConfigById(
        seller.storeId,
      );
      if (!storeConfig) {
        throw new HttpException(
          `Unable to merge seller configuration because the configuration of store (storeId: ${seller.storeId}) was not found.`,
          HttpStatus.NOT_FOUND,
        );
      }
      const config = this.configMapper.mapSellerToConfig(
        seller,
        storeConfig.storeCode,
      );
      await this.configService.merge(config);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error.message, { payload: JSON.stringify(seller) });
    }
  }
}
