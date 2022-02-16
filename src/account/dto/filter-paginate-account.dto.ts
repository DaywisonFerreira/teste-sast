import { ApiProperty } from '@nestjs/swagger';
import { RequestPaginateDto } from '../../commons/dtos/request-paginate.dto';
import { AccountTypeEnum } from '../schemas/account.schema';

export class FilterPaginateAccountDto extends RequestPaginateDto {
  @ApiProperty({
    type: String,
    required: false,
  })
  name: string;

  @ApiProperty({
    type: Boolean,
    required: false,
  })
  shipToAddress: boolean;

  @ApiProperty({
    type: String,
    required: false,
    enum: AccountTypeEnum,
  })
  accountType: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  locationId: string;
}
