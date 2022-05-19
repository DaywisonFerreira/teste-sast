import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Seeder } from 'nestjs-seeder';
import { macroStatus } from './data';
import { StatusCodeEntity } from '../schemas/status-code.schema';

@Injectable()
export class StatusCodeSeeder implements Seeder {
  constructor(
    @InjectModel(StatusCodeEntity.name)
    private readonly statusCode: Model<StatusCodeEntity>,
  ) {}

  async seed(): Promise<void> {
    const alreadySeed = await this.statusCode.countDocuments();
    if (alreadySeed === 0) {
      await this.statusCode.insertMany(macroStatus);
    }
  }

  async drop(): Promise<any> {
    return this.statusCode.deleteMany({});
  }
}
