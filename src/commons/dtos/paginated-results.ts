import { ApiProperty } from '@nestjs/swagger';

export abstract class PaginatedResults<T> {
  data: T[];

  @ApiProperty()
  currentPage: number;

  @ApiProperty()
  perPage: number;

  @ApiProperty()
  count: number;

  @ApiProperty()
  pages: number;

  @ApiProperty()
  total: number;

  constructor(data: T[], totalItems: number, page: number, pageSize: number) {
    this.data = data;
    this.count = data.length;
    this.currentPage = page;
    this.perPage = pageSize;
    this.total = totalItems;
    this.pages = Math.ceil(this.total / this.perPage);
  }
}
