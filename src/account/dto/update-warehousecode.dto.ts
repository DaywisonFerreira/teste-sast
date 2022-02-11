import { ApiProperty } from '@nestjs/swagger';

export class UpdateWarehouseCodeDto {
  @ApiProperty({
    description: 'External warehouse code',
    type: String,
    example: '368',
    required: false,
  })
  warehouseCode: string;
}
