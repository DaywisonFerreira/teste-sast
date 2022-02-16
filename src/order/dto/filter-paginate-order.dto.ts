import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { RequestPaginateDto } from 'src/commons/dtos/request-paginate.dto';

export class FilterPaginateOrderDto extends RequestPaginateDto {
  @ApiProperty({
    description: 'Search by order, orderSale, partnerOrder or receiverName',
    type: String,
    required: false,
    example: 'MTM4332214731',
  })
  @IsOptional()
  search?: string | null;

  @ApiProperty({
    description: 'Order creation date (start)',
    type: String,
    example: '2022-10-30',
    required: false,
  })
  @IsOptional()
  orderCreatedAtFrom?: string | null;

  @ApiProperty({
    description: 'Order creation date (end)',
    type: String,
    example: '2022-11-30',
    required: false,
  })
  @IsOptional()
  orderCreatedAtTo?: string | null;

  @ApiProperty({
    description: 'Last update of order date (start)',
    type: String,
    example: '2022-10-30',
    required: false,
  })
  @IsOptional()
  orderUpdatedAtFrom?: string | null;

  @ApiProperty({
    description: 'Last update of order date (end)',
    type: String,
    example: '2022-11-30',
    required: false,
  })
  @IsOptional()
  orderUpdatedAtTo?: string | null;

  @ApiProperty({
    description: 'Status of order',
    type: String,
    example: 'delivered',
    required: false,
  })
  @IsOptional()
  status?: string | null;

  @ApiProperty({
    description: 'Status of order by partner',
    type: String,
    example: 'Entregue',
    required: false,
  })
  @IsOptional()
  partnerStatus?: string | null;
}
