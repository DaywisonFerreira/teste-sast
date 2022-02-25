import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

interface Ishipment_volume_micro_state {
  id: number;
  code: string;
  default_name: string;
  i18n_name: string;
  description: string;
  shipment_order_volume_state_id: number;
  shipment_volume_state_source_id: number;
  name: string;
}

interface Iattachments {
  file_name: string;
  mime_type: string;
  type: string;
  processing_status: string;
  additional_information: {
    key1: string;
    key2: string;
  };
  url: string;
  created: number;
  created_iso: string;
  modified: number;
  modified_iso: string;
}

interface Ihistory {
  shipment_order_volume_id: number;
  shipment_order_volume_state: string;
  tracking_state: string;
  created: number;
  created_iso: string;
  provider_message: string;
  provider_state: string;
  shipper_provider_state: string;
  esprinter_message: string;
  shipment_volume_micro_state: Ishipment_volume_micro_state;
  attachments: Iattachments[];
  shipment_order_volume_state_localized: string;
  shipment_order_volume_state_history: number;
  event_date: number;
  event_date_iso: string;
}

interface Iinvoice {
  serie: string;
  number: string;
  key: string;
}

interface Ishipment_volume_micro_state {
  id: number;
  code: string;
  default_name: string;
  i18n_name: string;
  description: string;
  shipment_order_volume_state_id: number;
  shipment_volume_state_source_id: number;
  name: string;
}

interface Iclient {
  current: number;
  current_iso: string;
  original: number;
  original_iso: string;
}

interface Ilogistic_provider {
  current: number;
  current_iso: string;
  original: number;
  original_iso: string;
}

interface Iestimated_delivery_date {
  client: Iclient;
  logistic_provider: Ilogistic_provider;
}

export class CreateIntelipost {
  @ApiProperty({
    type: Object,
    required: true,
  })
  @IsNotEmpty()
  @IsObject()
  history: Ihistory;

  @ApiProperty({
    type: Object,
    required: true,
  })
  @IsNotEmpty()
  @IsObject()
  invoice: Iinvoice;

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
  estimated_delivery_date: Iestimated_delivery_date;

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  tracking_url: string;
}
