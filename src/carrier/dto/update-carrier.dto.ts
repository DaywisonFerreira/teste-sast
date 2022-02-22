import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';

class Attributes {
  @IsString()
  key: string;

  @IsString()
  value: string;
}
class Integration {
  @IsString()
  type: string;

  @IsString()
  endpoint: string;

  @ValidateNested({ each: true })
  @Type(() => Attributes)
  attributes: Attributes[];
}
export class UpdateCarrierDto {
  @ApiProperty({
    description: 'Generate a NOTFIS file',
    type: Boolean,
    example: true,
    default: true,
    required: false,
  })
  generateNotfisFile: boolean;

  @ApiPropertyOptional({
    description: 'External DeliveryMode Id',
    type: String,
    example: '368',
    required: false,
  })
  externalDeliveryMethodId: string;

  @ApiProperty({
    description: 'Carrier integration',
    type: Object,
    example: {
      type: 'FTP',
      endpoint: '',
      attributes: [
        {
          key: 'user',
          value: 'teste',
        },
        {
          key: 'password',
          value: 'teste',
        },
        {
          key: 'port',
          value: 21,
        },
        {
          key: 'secure',
          value: false,
        },
        {
          key: 'destPath',
          value: '/teste',
        },
      ],
    },
    required: false,
  })
  @ValidateNested()
  @Type(() => Integration)
  integration: Integration;
}
