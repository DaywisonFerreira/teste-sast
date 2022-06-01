import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

class Attributes {
  @IsString()
  key: string;

  @IsNotEmpty()
  value: string | number | boolean;
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

class DeliveryMethods {
  @IsString()
  deliveryModeName: string;

  @IsString()
  externalDeliveryMethodId: string;
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
    description: 'External DeliveryMethods',
    type: DeliveryMethods,
    example: [
      { deliveryModeName: 'LS SAMEDAY', externalDeliveryMethodId: '15111' },
      { deliveryModeName: 'LS NEXTDAY', externalDeliveryMethodId: '740' },
      { deliveryModeName: 'NORMAL', externalDeliveryMethodId: '1' },
    ],
    required: false,
  })
  @ValidateNested({ each: true })
  externalDeliveryMethods: DeliveryMethods[];

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
        {
          key: '61940ba2e689060011f69be1',
          value: '/pathByAccount',
        },
      ],
    },
    required: false,
  })
  @ValidateNested()
  @Type(() => Integration)
  integration: Integration;
}
