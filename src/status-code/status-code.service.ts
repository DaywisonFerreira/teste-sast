import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
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

  async getList(): Promise<LeanDocument<StatusCodeEntity[]>> {
    const statusCodes = await this.StatusCodeModel.find().lean();
    return statusCodes;
  }

  async getStatusCodeByName(
    statusCodeName: string,
  ): Promise<LeanDocument<StatusCodeEntity>> {
    return this.StatusCodeModel.findOne({ name: statusCodeName });
  }
}
