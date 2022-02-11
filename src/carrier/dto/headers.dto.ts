/* eslint-disable max-classes-per-file */
import { ApiProperty } from '@nestjs/swagger';

export class HeadersDto {
  @ApiProperty({
    type: 'string',
    description: 'Tenant',
    example: '61a9fbac5d4828001172df30',
  })
  'X-Tenant-Id': string;

  @ApiProperty({
    type: 'string',
    description: 'Channel Id',
    example: 'b6ff3536-cf3e-4e32-9c12-feed42683b3a',
  })
  'X-Channel-Id': string;

  authorization: string;
}
