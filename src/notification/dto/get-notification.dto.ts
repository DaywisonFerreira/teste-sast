import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { classToClass, plainToClass } from 'class-transformer';

export class GetNotificationDto {
  @ApiProperty({
    description: 'Id of notification',
    example: '614a2b322604e5437c11828c',
    type: String,
  })
  _id: string;

  @ApiProperty({
    description: 'Type of notification',
    example: 'orders.export.csv',
    type: String,
  })
  type: string;

  @ApiProperty({
    description: 'Origin of notification',
    example: 'system',
    type: String,
  })
  origin: string;

  @ApiProperty({
    description: 'Date the user was notified',
    example: '2021-09-21T18:57:54.717Z',
    type: Date,
  })
  createdAt: string;

  @ApiProperty({
    description: 'Status of notification has already been read by user',
    example: true,
    type: Boolean,
  })
  read: boolean;

  @ApiPropertyOptional({
    description: 'Notification payload with stringify (optional),',
    example: '"{"urlFile":"URL_BLOB_STORAGE"}"',
    required: false,
  })
  payload: string;

  public static factory(
    resultQuery: GetNotificationDto | GetNotificationDto[],
  ): GetNotificationDto | GetNotificationDto[] {
    const resultQueryDto = plainToClass(GetNotificationDto, resultQuery, {
      ignoreDecorators: true,
    });

    return classToClass(resultQueryDto);
  }
}
