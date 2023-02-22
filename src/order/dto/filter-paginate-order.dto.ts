import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { RequestPaginateDto } from 'src/commons/dtos/request-paginate.dto';

export class FilterPaginateOrderDto extends RequestPaginateDto {
  @ApiPropertyOptional({
    description: 'Search by order, orderSale, partnerOrder or receiverName',
    type: String,
    required: false,
    example: 'MTM4332214731',
  })
  @IsOptional()
  @IsString()
  search?: string | null;

  @ApiPropertyOptional({
    description:
      'Order creation date (start). Start and End must be 2 months interval. Example: 2022-01-18',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  orderCreatedAtFrom?: string | null;

  @ApiPropertyOptional({
    description:
      'Order creation date (end). Start and End must be 2 months interval. Example: 2022-01-18',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  orderCreatedAtTo?: string | null;

  @ApiPropertyOptional({
    description:
      'Estimated date of the delivery (start). Start and End must be 2 months interval. Example: 2022-01-18',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  shippingEstimateDateFrom?: string | null;

  @ApiPropertyOptional({
    description:
      'Estimated date of the delivery (end). Start and End must be 2 months interval. Example: 2022-01-18',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  shippingEstimateDateTo?: string | null;

  @ApiPropertyOptional({
    description: 'Status code of order. Example: dispatched,delivered,invoiced',
    type: String,
  })
  @IsOptional()
  @IsString()
  statusCode?: string | null;

  @ApiPropertyOptional({
    description:
      'Search for one or multiple orderSale or partnerOrder separated by comma.',
    type: String,
    required: false,
    example: '220048180, 220048190, 220048200',
  })
  @IsOptional()
  @IsString()
  orderNumbers?: string | null;
}
