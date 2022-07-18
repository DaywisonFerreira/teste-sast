import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { RequestPaginateDto } from 'src/commons/dtos/request-paginate.dto';

export class FilterPaginateOrderDto extends RequestPaginateDto {
  @ApiPropertyOptional({
    description: 'Search by order, orderSale, partnerOrder or receiverName',
    type: String,
    required: false,
    example: 'MTM4332214731',
  })
  @IsOptional()
  search?: string | null;

  @ApiPropertyOptional({
    description: 'Order creation date (start)',
    type: String,
    example: '2022-10-30',
    required: false,
  })
  @IsOptional()
  orderCreatedAtFrom?: string | null;

  @ApiPropertyOptional({
    description: 'Order creation date (end)',
    type: String,
    example: '2022-11-30',
    required: false,
  })
  @IsOptional()
  orderCreatedAtTo?: string | null;

  @ApiPropertyOptional({
    description: 'Estimated date of the delivery (start)',
    type: String,
    example: '2022-01-18',
    required: false,
  })
  @IsOptional()
  shippingEstimateDateFrom?: string | null;

  @ApiPropertyOptional({
    description: 'Estimated date of the delivery (end)',
    type: String,
    example: '2022-01-18',
    required: false,
  })
  @IsOptional()
  shippingEstimateDateTo?: string | null;

  @ApiPropertyOptional({
    description: 'Status code of order',
    type: String,
    example: 'dispatched,delivered,invoiced',
    required: false,
  })
  @IsOptional()
  statusCode?: string | null;
}
