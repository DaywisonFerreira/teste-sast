/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  ValidationPipe,
  Inject,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LogProvider } from 'src/commons/providers/log/log-provider.interface';
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
    @Inject('LogProvider')
    private readonly logger: LogProvider,
  ) {
    this.logger.instanceLogger(AccountController.name);
  }

  @Get()
  @ApiOkResponse({ type: PaginateAccountDto })
  async findAll(
    @Query(ValidationPipe) filterPaginateDto: FilterPaginateAccountDto,
  ): Promise<PaginateAccountDto> {
    this.logger.log(
      {
        key: 'ifc.freight.api.order.account-controller.findAll',
        message: `Find all accounts`,
      },
      {},
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
  async findOneAccount(@Param('id') id: string): Promise<GetAccountDto> {
    this.logger.log(
      {
        key: 'ifc.freight.api.order.account-controller.findOneAccount',
        message: `Find account ${id}`,
      },
      {},
    );
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
  ): Promise<GetAccountDto> {
    this.logger.log(
      {
        key: 'ifc.freight.api.order.account-controller.updateGenerateNotfisFile',
        message: `Update Notfis File ${id}`,
      },
      {},
    );
    try {
      const { generateNotfisFile, integrateIntelipost } = update;
      const account = await this.accountService.updateGenerateNotfisFile(id, {
        generateNotfisFile,
        integrateIntelipost,
      });
      return GetAccountDto.factory(account) as GetAccountDto;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  @Get('locations/:id')
  @ApiOkResponse({ type: GetAccountDto })
  async findOneLocation(@Param('id') id: string): Promise<GetAccountDto> {
    this.logger.log(
      {
        key: 'ifc.freight.api.order.account-controller.findOneLocation',
        message: `Find location ${id}`,
      },
      {},
    );
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
  ): Promise<GetAccountDto> {
    this.logger.log(
      {
        key: 'ifc.freight.api.order.account-controller.updateExternalWarehouseCode',
        message: `Update location ${id}`,
      },
      {},
    );
    try {
      const { warehouseCode } = update;

      const account = await this.accountService.updateWarehouseCode(id, {
        externalWarehouseCode: warehouseCode,
      });
      return GetAccountDto.factory(account) as GetAccountDto;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
