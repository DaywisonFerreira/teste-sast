import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsArray } from 'class-validator';

export class RequestDto {
  @ApiProperty({ type: String })
  @IsString()
  @Type(() => String)
  email: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  @IsString()
  userId: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  @IsString()
  userName: string;

  @ApiProperty({ type: Array })
  @Type(() => Array)
  @IsArray()
  tenants: string[];
}
