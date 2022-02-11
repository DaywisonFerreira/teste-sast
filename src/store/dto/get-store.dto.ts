import { ApiProperty } from '@nestjs/swagger';
import { classToClass, plainToClass } from 'class-transformer';

export class GetStoreDto {
  @ApiProperty({
    description: 'Store Id',
    type: String,
    example: '0e70f8ba-2b7e-4c43-828c-8c5c9fee43c1',
    required: true,
  })
  code: string;

  @ApiProperty({
    description: 'Store Active',
    type: Boolean,
    example: true,
    required: true,
  })
  active: boolean;

  @ApiProperty({
    description: 'Store Icon',
    type: String,
    example: 'Icon',
    required: true,
  })
  icon: string;

  @ApiProperty({
    description: 'User Id',
    type: String,
    example: '0e70f8ba-2b7e-4c43-828c-8c5c9fee43c1',
    required: true,
  })
  name: string;

  public static factory(
    resultQuery: GetStoreDto | GetStoreDto[],
  ): GetStoreDto | GetStoreDto[] {
    const resultQueryDto = plainToClass(GetStoreDto, resultQuery, {
      ignoreDecorators: true,
    });

    return classToClass(resultQueryDto);
  }
}
