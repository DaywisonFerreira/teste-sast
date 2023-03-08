import { PaginatedResults } from 'src/commons/dtos/paginated-results';
import { GetOrderDto } from './get-order.dto';

export class PaginateOrderDto extends PaginatedResults<GetOrderDto> {
  constructor(
    data: GetOrderDto[],
    count: number,
    page: number,
    pageSize: number,
    metadata?: any,
  ) {
    super(data, count, page, pageSize, metadata);
  }
}
