import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class AttachmentsDto {
  @IsNotEmpty()
  @IsString()
  file_name: string;

  @IsNotEmpty()
  @IsString()
  mime_type: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  processing_status: string;

  @IsOptional()
  @IsObject()
  // TODO: transformar em classe
  additional_information: {
    key1: string;
    key2: string;
  };

  // @IsOptional()
  // @IsString()
  url?: string;

  @IsNotEmpty()
  @IsNumber()
  created: number;

  @IsNotEmpty()
  @IsDateString()
  created_iso: string;

  @IsNotEmpty()
  @IsNumber()
  modified: number;

  @IsNotEmpty()
  @IsDateString()
  modified_iso: string;
}

class ShipmentVolumeMicroState {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  default_name: string;

  // @IsNotEmpty()
  // @IsString()
  i18n_name?: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  shipment_order_volume_state_id: number;

  @IsNotEmpty()
  @IsNumber()
  shipment_volume_state_source_id: number;

  @IsNotEmpty()
  @IsString()
  name: string;
}

class HistoryDto {
  @IsNotEmpty()
  @IsNumber()
  shipment_order_volume_id: number;

  @IsNotEmpty()
  @IsString()
  shipment_order_volume_state: string;

  @IsString()
  @IsOptional()
  tracking_state: string;

  @IsNotEmpty()
  @IsNumber()
  created: number;

  @IsNotEmpty()
  @IsDateString()
  created_iso: string;

  @IsString()
  @IsOptional()
  provider_message: string;

  @IsString()
  @IsOptional()
  provider_state: string;

  @IsString()
  @IsOptional()
  shipper_provider_state: string;

  @IsString()
  @IsOptional()
  esprinter_message: string;

  @IsNotEmpty()
  @IsObject()
  @Type(() => ShipmentVolumeMicroState)
  @ValidateNested({ message: 'shipment_volume_micro_state invalid.format' })
  shipment_volume_micro_state: ShipmentVolumeMicroState;

  @Type(() => AttachmentsDto)
  @ValidateNested({ each: true })
  attachments: AttachmentsDto[];

  @IsNotEmpty()
  @IsString()
  shipment_order_volume_state_localized: string;

  @IsNotEmpty()
  @IsNumber()
  shipment_order_volume_state_history: number;

  @IsNotEmpty()
  @IsNumber()
  event_date: number;

  @IsNotEmpty()
  @IsDateString()
  event_date_iso: string;
}

class InvoiceDto {
  @IsNotEmpty()
  @IsString()
  invoice_series: string;

  @IsNotEmpty()
  @IsString()
  invoice_number: string;

  @IsNotEmpty()
  @IsString()
  invoice_key: string;
}

class LogisticProviderDto {
  @IsNotEmpty()
  @IsNumber()
  current: number;

  @IsNotEmpty()
  @IsDateString()
  current_iso: string;

  @IsNotEmpty()
  @IsNumber()
  original: number;

  @IsNotEmpty()
  @IsDateString()
  original_iso: string;
}

class ClientDto {
  @IsNotEmpty()
  @IsNumber()
  current: number;

  @IsNotEmpty()
  @IsDateString()
  current_iso: string;

  @IsNotEmpty()
  @IsNumber()
  original: number;

  @IsNotEmpty()
  @IsDateString()
  original_iso: string;
}

class EstimatedDeliveryDateDto {
  @IsNotEmpty()
  @IsObject()
  @Type(() => ClientDto)
  @ValidateNested({ message: 'client invalid.format' })
  client: ClientDto;

  @Type(() => LogisticProviderDto)
  @ValidateNested({ message: 'logistic_provider invalid.format' })
  @IsObject()
  @IsOptional()
  logistic_provider: LogisticProviderDto;
}

export class CreateIntelipost {
  @ApiProperty({
    type: Object,
    required: true,
  })
  @IsNotEmpty()
  @IsObject()
  @Type(() => HistoryDto)
  @ValidateNested({ message: 'history invalid.format' })
  history: HistoryDto;

  @ApiProperty({
    type: Object,
    required: true,
  })
  @IsNotEmpty()
  @IsObject()
  @Type(() => InvoiceDto)
  @ValidateNested({ message: 'invoice invalid.format' })
  invoice: InvoiceDto;

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  order_number: string;

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  sales_order_number: string;

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  tracking_code: string;

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  volume_number: string;

  @ApiProperty({
    type: Object,
    required: true,
  })
  @IsNotEmpty()
  @IsObject()
  @IsNotEmpty()
  @Type(() => EstimatedDeliveryDateDto)
  @ValidateNested({ message: 'estimated_delivery_date invalid.format' })
  estimated_delivery_date: EstimatedDeliveryDateDto;

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  tracking_url: string;
}
