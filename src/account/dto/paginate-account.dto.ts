import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PaginatedResults } from '../../commons/dtos/paginated-results';
import { GetAccountDto } from './get-account.dto';

export class PaginateAccountDto extends PaginatedResults<GetAccountDto> {
  @ApiProperty({ type: () => [GetAccountDto] })
  @Type(() => GetAccountDto)
  data: GetAccountDto[];

  constructor(
    data: GetAccountDto[],
    count: number,
    page: number,
    pageSize: number,
  ) {
    super(data, count, page, pageSize);
  }
}
