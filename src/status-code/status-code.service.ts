import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  StatusCodeDocument,
  StatusCodeEntity,
} from './schemas/status-code.schema';

@Injectable()
export class StatusCodeService {
  constructor(
    @InjectModel(StatusCodeEntity.name)
    private StatusCodeModel: Model<StatusCodeDocument>,
  ) {}

  async getStatusCodeMacroList(): Promise<StatusCodeEntity[]> {
    const result = await this.StatusCodeModel.aggregate([
      { $sort: { macro: 1 } },
      { $group: { _id: '$macro', data: { $first: '$$ROOT' } } },
      { $project: { _id: 0, code: '$_id' } },
    ]).exec();
    return result;
  }

  async getStatusCodeMicroList(macro: string): Promise<StatusCodeEntity[]> {
    const result = await this.StatusCodeModel.aggregate([
      { $match: { macro } },
      {
        $project: {
          _id: 0,
          code: '$micro',
          description: '$description',
        },
      },
    ]).exec();
    return result;
  }
}
