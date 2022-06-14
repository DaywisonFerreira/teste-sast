/* eslint-disable max-classes-per-file */
import { Type } from 'class-transformer';

import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsNumber,
  IsObject,
  IsDate,
  IsUrl,
  IsOptional,
  IsArray,
} from 'class-validator';

export class Address {
  street: string;

  number: string;

  complement?: string;

  neighborhood: string;

  city: string;

  state: string;

  zipCode: string;

  country?: string;
}

export class ER {
  name: string;

  email?: string;

  document: string;

  documentType: string;

  phone: string;

  address: Address;
}

export class Carrier {
  name?: string;

  email?: string;

  document: string;

  documentType: string;

  stateInscription?: string;

  phone?: string;

  address?: Address;

  externalDeliveryMethodId?: string;
}

export class Package {
  productsQuantity: number;

  volume: number;

  grossWeight: number;

  netWeight: number;

  width: number;

  height: number;

  length: number;

  trackingCode: string;
}

export class CreateInvoiceDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsUrl()
  @IsString()
  notfisFile: string;

  @IsOptional()
  @IsString()
  notfisFileName: string;

  @IsNotEmpty()
  @IsNumber()
  number: number;

  @IsNotEmpty()
  @IsNumber()
  serie: number;

  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsString()
  protocol: string;

  @IsNotEmpty()
  @IsString()
  emissionDate: string;

  @IsNotEmpty()
  @IsString()
  operationType: string;

  @IsNotEmpty()
  @IsBoolean()
  isOut: boolean;

  @IsNotEmpty()
  @IsString()
  estimatedDeliveryDate: string;

  @IsNotEmpty()
  @IsObject()
  order: {
    internalOrderId: string;
    externalOrderId: string;
  };

  @IsNotEmpty()
  @IsArray()
  packages: Package[];

  @IsNotEmpty()
  @IsObject()
  total: {
    freightValue: number;
    value: number;
  };

  @IsNotEmpty()
  @IsObject()
  carrier: Carrier;

  @IsNotEmpty()
  @IsObject()
  emitter: ER;

  @IsNotEmpty()
  @IsObject()
  receiver: ER;

  @IsNotEmpty()
  @IsDate()
  createdAt: Date;

  @IsNotEmpty()
  @IsDate()
  updatedAt: Date;
}

export class KafkaCreateInvoiceDto {
  @Type(() => CreateInvoiceDto)
  @ValidateNested()
  @IsNotEmpty()
  value: CreateInvoiceDto;
}
