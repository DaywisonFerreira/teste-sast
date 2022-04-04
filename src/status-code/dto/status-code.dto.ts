import { ApiProperty } from '@nestjs/swagger';

export class GetStatusCodeDto {
  @ApiProperty({ example: '616de48e7b1e23aa6ec7204d' })
  id: string;

  @ApiProperty({ example: '616de48e7b1e23aa6ec7204d' })
  parentId: string;

  @ApiProperty({ example: 'Status Code Name' })
  name: string;
}
