import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { classToClass, plainToClass } from 'class-transformer';

class DeliveryMethods {
  deliveryModeName: string;

  externalDeliveryMethodId: string;
}

class Account {
  id: string;

  externalDeliveryMethods: DeliveryMethods[];
}

class Intelipost {
  accounts: Account[];
}

class Partners {
  intelipost: Intelipost;
}

class Attributes {
  key: string;

  value: string | number | boolean;
}
class Integration {
  type: string;

  endpoint: string;

  attributes: Attributes[];
}

export class GetCarrierDto {
  @ApiProperty({
    description: 'Identifier',
    type: String,
    example: '0e70f8ba-2b7e-4c43-828c-8c5c9fee43c1',
    required: true,
  })
  id: string;

  @ApiProperty({
    description: 'Carrier name',
    type: String,
    example: 'Xpto Cargas',
  })
  carrier: string;

  @ApiPropertyOptional({
    description: 'Carrier contact Email',
    type: String,
    example: 'xptocargas@xpto.com.br',
  })
  email: string;

  @ApiProperty({
    description: 'Carrier document (CNPJ no formatting)',
    type: String,
    example: '65765218000182',
  })
  document: string;

  @ApiPropertyOptional({
    description: 'Carrier contact Phone',
    type: String,
    example: '+55(013)3203-51-68',
  })
  phone: string;

  @ApiPropertyOptional({
    description: 'Carrier logo',
    type: String,
    example: 'logo.png',
  })
  logo: string;

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
  partners: Partners;

  @ApiProperty({
    description: 'Active Carrier',
    type: Boolean,
    example: true,
  })
  active: boolean;

  @ApiPropertyOptional({
    description: 'Carrier observation',
    type: String,
    example: 'an observation',
  })
  observation: string;

  @ApiPropertyOptional({
    description: 'Generate a NOTFIS file',
    type: Boolean,
    example: true,
    default: true,
    required: false,
  })
  generateNotfisFile: boolean;

  @ApiPropertyOptional({
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
  integration: Integration;

  public static factory(
    resultQuery: GetCarrierDto | GetCarrierDto[],
  ): GetCarrierDto | GetCarrierDto[] {
    const resultQueryDto = plainToClass(GetCarrierDto, resultQuery, {
      ignoreDecorators: true,
    });

    return classToClass(resultQueryDto);
  }
}
