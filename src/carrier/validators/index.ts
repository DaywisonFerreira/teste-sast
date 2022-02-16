/* eslint-disable max-classes-per-file */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Model } from 'mongoose';
import { CarrierDocument, CarrierEntity } from '../schemas/carrier.schema';

@ValidatorConstraint({ async: true })
@Injectable()
export class CnpjAlreadyExist implements ValidatorConstraintInterface {
  constructor(
    @InjectModel(CarrierEntity.name)
    private carrierModel: Model<CarrierDocument>,
  ) {}

  async validate(value: string, _: ValidationArguments): Promise<boolean> {
    const result = await this.carrierModel.exists({
      document: value && value.trim(),
    });
    return !result;
  }
}

@ValidatorConstraint({ async: true })
@Injectable()
export class NameAlreadyExist implements ValidatorConstraintInterface {
  constructor(
    @InjectModel(CarrierEntity.name)
    private carrierModel: Model<CarrierDocument>,
  ) {}

  async validate(value: string, _: ValidationArguments): Promise<boolean> {
    const result = await this.carrierModel.exists({
      carrier: value && value.trim(),
    });
    return !result;
  }
}
