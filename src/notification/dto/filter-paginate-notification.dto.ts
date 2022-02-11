import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { RequestPaginateDto } from '../../commons/dtos/request-paginate.dto';

export class FilterPaginateNotificationDto extends OmitType(
  RequestPaginateDto,
  ['sortby'],
) {
  @ApiPropertyOptional({
    description: 'Notification read or not',
    type: Boolean,
    example: false,
    required: false,
  })
  @IsOptional()
  read?: string;
}
