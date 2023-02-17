import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class ConsolidatedReportOrdersDTO {
  @ApiProperty({
    description:
      'Order createdAt date (start). Start and End must be 2 months interval. Example: 2022-10-30',
    type: String,
    required: true,
  })
  @IsDateString()
  @IsNotEmpty()
  orderCreatedAtFrom: string;

  @ApiProperty({
    description:
      'Order createdAt date (end). Start and End must be 2 months interval. Example: 2022-11-30',
    type: String,
    required: true,
  })
  @IsDateString()
  @IsNotEmpty()
  orderCreatedAtTo: string;
}

export class HeadersConsolidatedReportOrdersDTO {
  @ApiPropertyOptional({
    description: 'Correlation Id',
    type: String,
  })
  'x-correlation-id': string;
}
