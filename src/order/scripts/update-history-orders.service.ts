import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

import { OrderDocument, OrderEntity } from '../schemas/order.schema';
import { OrderMapper } from '../mappers/orderMapper';
import { HandleStatusCode } from './handle-status-code.service';

@Injectable()
export class UpdateHistoryOrders {
  private readonly logger = new Logger(UpdateHistoryOrders.name);

  constructor(
    @InjectModel(OrderEntity.name)
    private OrderModel: Model<OrderDocument>,
    private handleStatusCodeService: HandleStatusCode,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async pag() {
    // eslint-disable-next-line
    for (let i = 0; i < 15; i++) {
      await this.updateDuplicateOrders();
    }
  }

  async updateDuplicateOrders() {
    const filter = { storeCode: 'NIKE', 'history.statusCode': null };
    const orders = await this.OrderModel.find(filter).limit(5000).lean();

    this.logger.log(`Found ${orders.length} orders`);

    const result = { success: 0, error: 0 };

    for (const order of orders) {
      const history =
        order.history?.map(({ statusCode: st, ...o }) => ({
          ...o,
          statusCode:
            st ||
            this.handleStatusCodeService.getStatusCode(o.lastOccurrenceMicro),
        })) || [];

      let { statusCode, status } = order;
      if (history?.length) {
        ({ statusCode } = history[history.length - 1]);
      }

      if (statusCode.micro === 'delivered-success') {
        status = 'delivered';
      }

      await this.OrderModel.findOneAndUpdate(
        { _id: order._id },
        { ...order, history, statusCode, status },
        { useFindAndModify: false },
      );

      if (
        order.storeId &&
        order.storeCode &&
        order.internalOrderId &&
        !Number.isNaN(parseInt(order.internalOrderId, 10))
      ) {
        const exchange = 'order';
        const routeKey = 'orderTrackingUpdated';
        const exportingOrder: any =
          OrderMapper.mapPartnerToExportingOrder(order);

        await this.amqpConnection.publish(exchange, routeKey, exportingOrder);

        this.logger.log(
          `Order ${order.orderSale} sent to exchange '${exchange}' and routeKey '${routeKey}'`,
        );
        // eslint-disable-next-line
        result.success++;
      } else {
        this.logger.log(
          `${order.orderSale} order not sent due to lack of storeId (${order.storeId}), storeCode (${order.storeCode}) or internalOrderId (${order.internalOrderId})`,
        );
        // eslint-disable-next-line
        result.error++;
      }
    }
    this.logger.log(
      `Finish process with ${orders.length} orders, ${result.success} success and ${result.error} errors`,
    );
  }
}
