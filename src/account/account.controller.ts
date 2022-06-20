/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
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
  constructor(private readonly accountService: AccountService) {}

  @Get()
  @ApiOkResponse({ type: PaginateAccountDto })
  async findAll(
    @Query() filterPaginateDto: FilterPaginateAccountDto,
    @Req() req: any,
  ): Promise<PaginateAccountDto> {
    req.logger.verbose(
      `A request was received to get accounts with the query: ${JSON.stringify(
        filterPaginateDto,
      )}`,
    );
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

  @Get(':id')
  @ApiOkResponse({ type: GetAccountDto })
  async findOneAccount(
    @Param('id') id: string,
  ): Promise<GetAccountDto> {
    const account = await this.accountService.findOneAccountOrLocation(
      id,
      'account',
    );
    // @ts-ignore
    return GetAccountDto.factory(account) as GetAccountDto;
  }

  @Patch(':id')
  async updateGenerateNotfisFile(
    @Param('id') id: string,
    @Body() update: UpdateGenerateNotfisFile,
    @Req() req: any,
  ): Promise<GetAccountDto> {
    try {
      const { generateNotfisFile, integrateIntelipost } = update;
      const account = await this.accountService.updateGenerateNotfisFile(id, {
        generateNotfisFile,
        integrateIntelipost,
      });
      return GetAccountDto.factory(account) as GetAccountDto;
    } catch (error) {
      req.logger.error(error);
      throw error;
    }
  }

  @Get('locations/:id')
  @ApiOkResponse({ type: GetAccountDto })
  async findOneLocation(
    @Param('id') id: string,
  ): Promise<GetAccountDto> {
    const account = await this.accountService.findOneAccountOrLocation(
      id,
      'location',
    );
    // @ts-ignore
    return GetAccountDto.factory(account) as GetAccountDto;
  }

  @Patch('locations/:id')
  @ApiOkResponse({ type: GetAccountDto })
  async updateExternalWarehouseCode(
    @Param('id') id: string,
    @Body() update: UpdateWarehouseCodeDto,
    @Req() req: any,
  ): Promise<GetAccountDto> {
    try {
      const { warehouseCode } = update;

      const account = await this.accountService.updateWarehouseCode(id, {
        externalWarehouseCode: warehouseCode,
      });
      return GetAccountDto.factory(account) as GetAccountDto;
    } catch (error) {
      req.logger.error(error);
      throw error;
    }
  }
}
