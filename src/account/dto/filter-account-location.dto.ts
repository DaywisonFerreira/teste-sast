import { ApiProperty } from '@nestjs/swagger';

export class FilterAccountLocationDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  locationId: string;
}
