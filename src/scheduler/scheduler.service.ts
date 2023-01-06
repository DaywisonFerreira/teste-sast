import { InfraLogger } from '@infralabs/infra-logger';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { existsSync, mkdirSync } from 'fs';
import { readdir, stat, unlink } from 'fs/promises';
import { isAfter } from 'date-fns';
import { Env } from '../commons/environment/env';

@Injectable()
export class SchedulerService {
  private readonly logger = new InfraLogger({}, SchedulerService.name);

  private readonly tmp_path =
    Env.NODE_ENV !== 'local'
      ? `${process.cwd()}/dist/tmp`
      : `${process.cwd()}/src/tmp`;

  constructor() {
    if (!existsSync(this.tmp_path)) mkdirSync(this.tmp_path);
  }

  @Cron(
    Env.NODE_ENV !== 'local'
      ? CronExpression.EVERY_DAY_AT_1AM
      : CronExpression.EVERY_DAY_AT_1PM,
  )
  async clearTmpFolder() {
    this.logger.log(
      `${SchedulerService.name}: Start Cron remove older files from disk...`,
    );
    const yesterday = new Date();
    yesterday.setDate(new Date().getDate() - 1);
    try {
      const files = await readdir(this.tmp_path);

      if (!files.length) {
        this.logger.log(
          `${SchedulerService.name}: Empty folder, no files to be checked`,
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
      this.logger.log(`${SchedulerService.name}: End Cron Successful`);
    }
  }
}
