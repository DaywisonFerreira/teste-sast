import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Scope,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';

import { v4 as uuidV4 } from 'uuid';
import { LogProvider } from '@infralabs/infra-logger';

import { ICarrier } from './interfaces/carrier.interface';
import { CarrierDocument, CarrierEntity } from './schemas/carrier.schema';

@Injectable({ scope: Scope.TRANSIENT })
export class CarrierService {
  constructor(
    @InjectModel(CarrierEntity.name)
    private carrierModel: Model<CarrierDocument>,
    @Inject('LogProvider') private logger: LogProvider,
  ) {
    this.logger.context = CarrierService.name;
  }

  async create(carrierData: ICarrier): Promise<LeanDocument<CarrierEntity>> {
    try {
      // eslint-disable-next-line new-cap
      const carrierToSave = new this.carrierModel({
        id: uuidV4(),
        ...carrierData,
      });
      const carrierSaved = await carrierToSave.save();
      return carrierSaved.toJSON();
    } catch (error) {
      let message: string;
      if (error instanceof Error) {
        message = error.message;
        this.logger.error(error);
      }
      throw new InternalServerErrorException(
        message || 'Internal server error',
      );
    }
  }

  async findByDocument(document: string) {
    return this.carrierModel.findOne({ document }).lean();
  }

  async updateLogo(id: string, update: Partial<LeanDocument<CarrierDocument>>) {
    const carrier = await this.carrierModel.findOne({ id });

    if (!carrier) {
      throw new HttpException('Carrier not found.', HttpStatus.NOT_FOUND);
    }
    return this.carrierModel.findOneAndUpdate({ id }, update, {
      timestamps: true,
      lean: true,
      new: true,
      projection: { __v: 0, _id: 0 },
    });
  }

  async update(
    id: string,
    carrierData: Partial<LeanDocument<CarrierDocument>>,
  ): Promise<LeanDocument<CarrierEntity>> {
    const carrier = await this.carrierModel.findOne({ id });

    if (!carrier) {
      throw new HttpException('Carrier not found.', HttpStatus.NOT_FOUND);
    }

    return this.carrierModel
      .findOneAndUpdate({ id }, carrierData, {
        timestamps: true,
        upsert: true,
        lean: true,
        new: true,
        projection: { __v: 0, _id: 0 },
      })
      .lean();
  }

  async updateConsumer(
    id: string,
    carrierData: Partial<LeanDocument<CarrierDocument>>,
  ): Promise<LeanDocument<CarrierEntity>> {
    return this.carrierModel
      .findOneAndUpdate({ id }, carrierData, {
        timestamps: true,
        upsert: true,
        lean: true,
        new: true,
        projection: { __v: 0, _id: 0 },
      })
      .lean();
  }

  async findOne(id: string) {
    const carrier = await this.carrierModel.findOne({ id }).lean();

    if (!carrier) {
      throw new HttpException('Carrier not found.', HttpStatus.NOT_FOUND);
    }

    return carrier;
  }
}
