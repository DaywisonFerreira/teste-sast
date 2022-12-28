import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

class DeliveryMethods {
  @IsString()
  @IsNotEmpty()
  deliveryModeName: string;

  @IsBoolean()
  @IsNotEmpty()
  active: boolean;

  @IsString()
  @IsNotEmpty()
  externalDeliveryMethodId: string;
}
class Account {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsNotEmpty()
  integrateIntelipost: boolean;

  @ValidateNested({ each: true })
  @Type(() => DeliveryMethods)
  externalDeliveryMethods: DeliveryMethods[];
}

class Intelipost {
  @ValidateNested({ each: true })
  @Type(() => Account)
  accounts: Account[];
}

class Partners {
  @ValidateNested({ each: true })
  @Type(() => Intelipost)
  intelipost: Intelipost;
}

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

  @ApiPropertyOptional({
    description: 'Carrier partners',
    type: Object,
    example: {
      intelipost: {
        accounts: [
          {
            id: '62138e29f97af3226d0af8a5',
            externalDeliveryMethods: [
              {
                deliveryModeName: 'LS SAMEDAY',
                externalDeliveryMethodId: '15111',
              },
              {
                deliveryModeName: 'RAPIDA',
                externalDeliveryMethodId: '740',
              },
            ],
          },
        ],
      },
    },
    required: false,
  })
  @ValidateNested()
  @Type(() => Partners)
  partners: Partners;

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
