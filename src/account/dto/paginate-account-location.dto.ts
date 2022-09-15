import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PaginatedResults } from '../../commons/dtos/paginated-results';
import { GetAccountLocationDto } from './get-account-location.dto';

export class PaginateAccountLocationDto extends PaginatedResults<GetAccountLocationDto> {
  @ApiProperty({ type: () => [GetAccountLocationDto] })
  @Type(() => GetAccountLocationDto)
  data: GetAccountLocationDto[];

  constructor(
    data: GetAccountLocationDto[],
    count: number,
    page: number,
    pageSize: number,
  ) {
    super(data, count, page, pageSize);
  }
}
