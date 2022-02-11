import { ApiPropertyOptional } from '@nestjs/swagger';

export class ParamsMarkAsReadDto {
  @ApiPropertyOptional({
    description: 'Mark all notification as read',
    type: Boolean,
    example: false,
    required: false,
  })
  all?: string;

  @ApiPropertyOptional({
    description: 'Mark a single notification as read',
    example: '614a2b322604e5437c11828c',
    type: String,
  })
  notificationId?: string;
}
