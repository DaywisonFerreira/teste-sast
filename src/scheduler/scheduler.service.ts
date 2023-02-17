import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { existsSync, mkdirSync } from 'fs';
import { readdir, stat, unlink } from 'fs/promises';
import { isAfter } from 'date-fns';
import { NestjsEventEmitter } from 'src/commons/providers/event/nestjs-event-emitter';
import { LogProvider } from 'src/commons/providers/log/log-provider.interface';
import { Types } from 'mongoose';
import { Env } from '../commons/environment/env';
import { AccountService } from '../account/account.service';
import { OrderService } from '../order/order.service';

@Injectable()
export class SchedulerService {
  private readonly tmp_path =
    Env.NODE_ENV !== 'local'
      ? `${process.cwd()}/dist/tmp`
      : `${process.cwd()}/src/tmp`;

  constructor(
    private readonly eventEmitter: NestjsEventEmitter,
    private readonly accountService: AccountService,
    private readonly orderService: OrderService,
    @Inject('LogProvider')
    private readonly logger: LogProvider,
  ) {
    this.logger.instanceLogger(SchedulerService.name);
    if (!existsSync(this.tmp_path)) mkdirSync(this.tmp_path);
  }

  @Cron(CronExpression[Env.CRON_TIME_REPROCESS_INVOICES_ERROR_STATUS])
  async reprocessInvoices(): Promise<void> {
    try {
      this.logger.log({
        key: 'ifc.freight.api.order.scheduler-service.reprocessInvoices',
        message: `${SchedulerService.name}: Starting Cron to Reprocess invoices with error ...`,
      });
      return this.eventEmitter.emit('invoice.reprocess', null);
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  @Cron(
    Env.NODE_ENV !== 'local'
      ? CronExpression.EVERY_DAY_AT_1AM
      : CronExpression.EVERY_DAY_AT_1PM,
  )
  async clearTmpFolder() {
    this.logger.log({
      key: 'ifc.freight.api.order.scheduler-service.clearTmpFolder',
      message: `${SchedulerService.name}: Start Cron remove older files from disk...`,
    });
    const yesterday = new Date();
    yesterday.setDate(new Date().getDate() - 1);
    try {
      const files = await readdir(this.tmp_path);

      if (!files.length) {
        this.logger.log(
          {
            key: 'ifc.freight.api.order.scheduler-service.clearTmpFolder.no-files',
            message: `${SchedulerService.name}: Empty folder, no files to be checked`,
          },
          {},
        );
        return;
      }

      for await (const file of files) {
        const stats = await stat(`${this.tmp_path}/${file}`);
        const isAnOlderFile = isAfter(yesterday, stats.birthtime);
        if (isAnOlderFile) {
          await unlink(`${this.tmp_path}/${file}`);
        }
      }
    } catch (error) {
      this.logger.error(error);
    } finally {
      this.logger.log(
        {
          key: 'ifc.freight.api.order.scheduler-service.clearTmpFolder.finish',
          message: `${SchedulerService.name}: End Cron Successful`,
        },
        {},
      );
    }
  }

  @Cron(CronExpression[Env.CRON_TIME_REMOVE_USELESS_ORDERS])
  async removeUselessOrders(): Promise<void> {
    try {
      this.logger.log({
        key: 'ifc.freight.api.order.scheduler-service.removeUselessOrders',
        message: `${SchedulerService.name}: Starting Cron to remove useless orders ...`,
      });
      const accounts = await this.accountService.find({ useDeliveryHub: true });

      const accountsIds = accounts
        .map(acc => {
          try {
            return new Types.ObjectId(acc.id);
          } catch (error) {
            this.logger.log({
              key: 'ifc.freight.api.order.scheduler-service.removeUselessOrders',
              message: `Invalid Id: ${acc.id}`,
            });
            return null;
          }
        })
        .filter(Boolean);

      if (!accountsIds.length) return;

      const uselessOrders = await this.orderService.find(
        {
          storeId: { $nin: accountsIds },
        },
        { limit: Env.LIMIT_QUERY_USELESS_ORDERS, sort: { createdAt: 1 } },
      );

      if (!uselessOrders.length) {
        this.logger.log({
          key: 'ifc.freight.api.order.scheduler-service.removeUselessOrders',
          message: `${SchedulerService.name}: No orders to be deleted`,
        });
        return;
      }

      this.logger.log({
        key: 'ifc.freight.api.order.scheduler-service.removeUselessOrders',
        message: `${SchedulerService.name}: Removing ${
          uselessOrders.length
        } orders, from accounts [${accountsIds.join(',')}]`,
      });

      await this.orderService.deleteMany({
        orderId: { $in: uselessOrders.map(order => order.orderId) },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
