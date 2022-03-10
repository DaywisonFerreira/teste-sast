/* eslint-disable @typescript-eslint/ban-ts-comment */
import { LogProvider } from '@infralabs/infra-logger';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { FilterPaginateAccountDto } from './dto/filter-paginate-account.dto';
import { GetAccountDto } from './dto/get-account.dto';
import { PaginateAccountDto } from './dto/paginate-account.dto';
import { UpdateWarehouseCodeDto } from './dto/update-warehousecode.dto';
import { UpdateGenerateNotfisFile } from './dto/update-generatenotfisfile.dto';

@Controller('accounts')
@ApiTags('Accounts')
@ApiBearerAuth()
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    @Inject('LogProvider') private logger: LogProvider,
  ) {
    this.logger.context = AccountController.name;
  }

  @Get()
  @ApiOkResponse({ type: PaginateAccountDto })
  async findAll(
    @Query() filterPaginateDto: FilterPaginateAccountDto,
  ): Promise<PaginateAccountDto> {
    const {
      name,
      shipToAddress,
      accountType,
      locationId,
      page = 1,
      perPage = 20,
      orderBy,
      orderDirection,
    } = filterPaginateDto;

    const pageNumber = Math.abs(page);
    const pageSize = Math.abs(perPage);
    const sortBy = orderBy || 'name';

    const [resultQuery, count] = await this.accountService.findAll(
      { name, shipToAddress, accountType, locationId },
      pageNumber,
      pageSize,
      sortBy,
      orderDirection,
    );

    return new PaginateAccountDto(
      JSON.parse(JSON.stringify(resultQuery)),
      count,
      pageNumber,
      pageSize,
    );
  }

  @Get('locations/:id')
  @ApiOkResponse({ type: GetAccountDto })
  async findOneLocation(@Param('id') id: string): Promise<GetAccountDto> {
    const account = await this.accountService.findOneLocation(id);
    // @ts-ignore
    return GetAccountDto.factory(account) as GetAccountDto;
  }

  @Patch('locations/:id')
  @ApiOkResponse({ type: GetAccountDto })
  async updateExternalWarehouseCode(
    @Param('id') id: string,
    @Body() update: UpdateWarehouseCodeDto,
  ): Promise<GetAccountDto> {
    const { warehouseCode } = update;

    const account = await this.accountService.updateWarehouseCode(id, {
      externalWarehouseCode: warehouseCode,
    });
    return GetAccountDto.factory(account) as GetAccountDto;
  }

  @Patch('/:id')
  async updateGenerateNotfisFile(
    @Param('id') id: string,
    @Body() update: UpdateGenerateNotfisFile,
  ): Promise<GetAccountDto> {
    const { generateNotfisFile } = update;
    const account = await this.accountService.updateGenerateNotfisFile(id, {
      generateNotfisFile,
    });
    return GetAccountDto.factory(account) as GetAccountDto;
  }
}
