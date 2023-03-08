import { ApiProperty } from '@nestjs/swagger';
import { classToClass, plainToClass } from 'class-transformer';

export class GetStatusCodeMacroDto {
  @ApiProperty({ example: 'order-dispatched' })
  code: string;

  public static factory(
    resultQuery: GetStatusCodeMacroDto | GetStatusCodeMacroDto[],
  ): GetStatusCodeMacroDto | GetStatusCodeMacroDto[] {
    const resultQueryDto = plainToClass(GetStatusCodeMacroDto, resultQuery, {
      ignoreDecorators: true,
    });

    return classToClass(resultQueryDto, { excludePrefixes: ['_', '__'] });
  }
}

export class GetStatusCodeMicroDto {
  @ApiProperty({ example: 'order-dispatched' })
  code: string;

  @ApiProperty({ example: 'Aguardando coleta' })
  description: string;

  public static factory(
    resultQuery: GetStatusCodeMicroDto | GetStatusCodeMicroDto[],
  ): GetStatusCodeMicroDto | GetStatusCodeMicroDto[] {
    const resultQueryDto = plainToClass(GetStatusCodeMicroDto, resultQuery, {
      ignoreDecorators: true,
    });

    return classToClass(resultQueryDto, { excludePrefixes: ['_', '__'] });
  }
}
