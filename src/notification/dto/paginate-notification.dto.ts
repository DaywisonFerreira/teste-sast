import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PaginatedResults } from '../../commons/dtos/paginated-results';
import { GetNotificationDto } from './get-notification.dto';

export class PaginateNotificationDto extends PaginatedResults<GetNotificationDto> {
  @ApiProperty({
    example: [
      {
        _id: '614a2b322604e5437c11828c',
        type: 'orders.export.csv',
        createdAt: '2021-09-21T18:57:54.717Z',
        payload: {
          urlFile: 'URL_BLOB_STORAGE',
        },
        read: false,
      },
      {
        _id: '614a2b322604e5437c11828c',
        type: 'orders.export.csv',
        createdAt: '2021-09-21T18:57:54.717Z',
        payload: {
          urlFile: 'URL_BLOB_STORAGE',
        },
        read: true,
      },
    ],
  })
  @Type(() => GetNotificationDto)
  rows: GetNotificationDto[];

  @ApiProperty({
    description: 'Number of notifications unread',
    example: 2,
    type: Number,
  })
  unreadCount: number;

  constructor(
    data: GetNotificationDto[],
    count: number,
    page: number,
    pageSize: number,
    unreadCount: number,
  ) {
    super(data, count, page, pageSize);
    this.unreadCount = unreadCount;
  }
}
