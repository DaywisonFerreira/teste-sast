import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class RequestPaginateDto {
  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ type: Number, example: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  perPage?: number;

  @ApiPropertyOptional({ example: 'name' })
  @IsOptional()
  @IsString()
  orderBy?: string;

  @ApiPropertyOptional({ example: 'asc' })
  @IsOptional()
  @IsString()
  orderDirection?: string;

  // TODO: REFATORAR TODOS OS ENDPOINTS QUE USAM A LISTAGEM NO FORMATO ERRADO
  @ApiPropertyOptional({ type: Number, example: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pagesize?: number;

  // TODO: REFATORAR TODOS OS ENDPOINTS QUE USAM A LISTAGEM NO FORMATO ERRADO
  @ApiPropertyOptional({ example: 'name' })
  @IsOptional()
  @IsString()
  sortby?: string;
}
