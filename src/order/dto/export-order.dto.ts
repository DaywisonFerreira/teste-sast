import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({
    description: 'Store id',
    type: String,
    example: '6126e04cc6151e00306b9820',
    required: true,
  })
  storeId: string;
}
