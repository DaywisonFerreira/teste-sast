import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExportOrdersDto {
  @ApiProperty({
    description: 'Range of list (start)',
    type: String,
    example: '2022-10-30',
    required: true,
  })
  orderCreatedAtFrom: string;

  @ApiProperty({
    description: 'Range of list (end)',
    type: String,
    example: '2022-11-30',
    required: true,
  })
  orderCreatedAtTo: string;
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
