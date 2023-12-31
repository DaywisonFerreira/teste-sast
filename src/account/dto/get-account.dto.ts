import { ApiProperty } from '@nestjs/swagger';
import { classToClass, plainToClass } from 'class-transformer';

interface IAccounts {
  id: string;
  name: string;
}

interface IAddress {
  city: string;
  state: string;
  zipCode: string;
  neighborhood: string;
  country: string;
  street: string;
  number: string;
  complement: string;
}

export class GetAccountDto {
  @ApiProperty({ example: '616de48e7b1e23aa6ec7204d' })
  id: string;

  @ApiProperty({ example: 'Icone' })
  icon: string;

  @ApiProperty({ example: 'Faber Castell Location' })
  name: string;

  @ApiProperty({ example: '06807000' })
  zipCode: string;

  @ApiProperty({
    example: {
      zipCode: '06807000',
      city: 'Embu das Artes',
      state: 'SP',
      country: 'BRA',
      street: 'Avenida Hélio Ossamu Daikuara - de 839/840 a 3227/3228',
      neighborhood: 'Jardim Vista Alegre',
      number: '100',
      complement: 'casa',
    },
  })
  address: IAddress;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: 'document' })
  document: string;

  @ApiProperty({ example: '368' })
  externalWarehouseCode: string;

  @ApiProperty({ example: 'location' })
  accountType: string;

  @ApiProperty({ example: true })
  shipToAddress: boolean;

  @ApiProperty({ example: ['717de48e8b1e23aa6ec8204d'] })
  accounts: IAccounts[];

  @ApiProperty({ example: ['60d4904ddc917230fb5b5a60'] })
  salesChannels: any[];

  @ApiProperty({ example: '2021-10-19T22:15:08.355Z' })
  createdAt: Date;

  @ApiProperty({ example: '2021-10-19T22:15:08.355Z' })
  updatedAt: Date;

  public static factory(
    resultQuery: GetAccountDto | GetAccountDto[],
  ): GetAccountDto | GetAccountDto[] {
    const resultQueryDto = plainToClass(GetAccountDto, resultQuery, {
      ignoreDecorators: true,
    });

    return classToClass(resultQueryDto);
  }
}
