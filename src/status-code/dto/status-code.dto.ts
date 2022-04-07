import { ApiProperty } from '@nestjs/swagger';
import { v4 as uuidV4 } from 'uuid';

export class GetStatusCodeDto {
  @ApiProperty({ example: '616de48e7b1e23aa6ec7204d' })
  id: string;

  @ApiProperty({ example: uuidV4() || null })
  parentId: string;

  @ApiProperty({ example: 'Status Code Name' })
  name: string;
}
