import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Put,
  Query,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { RequestDto } from 'src/commons/dtos/request.dto';
import { JWTGuard } from 'src/commons/guards/jwt.guard';
import { FilterPaginateNotificationDto } from './dto/filter-paginate-notification.dto';
import { PaginateNotificationDto } from './dto/paginate-notification.dto';
import { ParamsMarkAsReadDto } from './dto/params-mark-as-read.dto';

import { NotificationService } from './notification.service';

@Controller('notifications')
@ApiTags('Notifications')
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @UseGuards(JWTGuard)
  @ApiOkResponse({ type: PaginateNotificationDto })
  async listNotificationsByUser(
    @Request() request: RequestDto,
    @Query(ValidationPipe)
    filterPaginateDto: FilterPaginateNotificationDto,
  ): Promise<PaginateNotificationDto> {
    const { page, pagesize } = filterPaginateDto;
    const { read } = filterPaginateDto;
    const { userId } = request;

    const pageNumber = page ? Number(page) : 0;
    const pageSize = pagesize ? Number(pagesize) : 10;

    const [resultQuery, count, unreadCount] =
      await this.notificationService.listByUser(
        userId,
        pageNumber,
        pageSize,
        read,
      );

    const result = resultQuery.map(notification => {
      const { _id, type, payload, createdAt, notifiedUsers, origin } =
        notification;
      return {
        _id,
        type,
        createdAt,
        origin,
        payload: payload ? JSON.parse(payload) : {},
        read: notifiedUsers.find(notify => notify.user === userId).read,
      };
    });

    return new PaginateNotificationDto(
      JSON.parse(JSON.stringify(result)),
      count,
      pageNumber,
      pageSize,
      unreadCount,
    );
  }

  @Put()
  async markNotificationAsRead(
    @Request() request: RequestDto,
    @Query() params: ParamsMarkAsReadDto,
  ) {
    const { userId } = request;
    const { all, notificationId } = params;

    if (!all && !notificationId) {
      throw new HttpException(
        'Missing params "all" or "id"',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (all && notificationId) {
      throw new HttpException(
        'Bad request only one of this params: "allNotifications" or "notificationId"',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.notificationService.markAsRead(userId, all, notificationId);
  }
}
