import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ExportOrdersDto {
  @ApiProperty({
    description: 'Order createdAt date (start). Start and End must be 2 months interval. Example: 2022-10-30',
    type: String,
    required: true,
  })
  @IsDateString()
  @IsNotEmpty()
  orderCreatedAtFrom: string;

  @ApiProperty({
    description: 'Order createdAt date (end). Start and End must be 2 months interval. Example: 2022-11-30. ',
    type: String,
    required: true,
  })
  @IsDateString()
  @IsNotEmpty()
  orderCreatedAtTo: string;

  @ApiPropertyOptional({
    description: 'Type of the exported file. Default: xlsx',
    type: String,
    default: 'xlsx',
  })
  @IsOptional()
  @IsString()
  type?: string;
}

export class HeadersExportOrdersDto {
  @ApiProperty({
    description: 'Tenant Id',
    type: String,
    required: true,
  })
  'x-tenant-id': string;

  @ApiPropertyOptional({
    description: 'Correlation Id',
    type: String,
  })
  'x-correlation-id': string;
}
