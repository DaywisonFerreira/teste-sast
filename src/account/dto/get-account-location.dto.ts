import { ApiProperty } from '@nestjs/swagger';
import { classToClass, plainToClass } from 'class-transformer';

export class GetAccountLocationDto {
  @ApiProperty({ example: '616de48e7b1e23aa6ec7204d' })
  id: string;

  @ApiProperty({ example: 'Faber Castell Location' })
  name: string;

  public static factory(
    resultQuery: GetAccountLocationDto | GetAccountLocationDto[],
  ): GetAccountLocationDto | GetAccountLocationDto[] {
    const resultQueryDto = plainToClass(GetAccountLocationDto, resultQuery, {
      ignoreDecorators: true,
    });

    return classToClass(resultQueryDto);
  }
}
