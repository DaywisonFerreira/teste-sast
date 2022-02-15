/* eslint-disable import/named */
import { LogProvider } from '@infralabs/infra-logger';
import { KafkaService } from '@infralabs/infra-nestjs-kafka';
import { v4 as uuidV4 } from 'uuid';
import {
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Env } from 'src/commons/environment/env';
import { RequestDto } from 'src/commons/dtos/request.dto';
import { JWTGuard } from 'src/commons/guards/jwt.guard';
import { FilterPaginateOrderDto } from './dto/filter-paginate-order.dto';
import { PaginateOrderDto } from './dto/paginate-order.dto';
import { OrderService } from './order.service';
import {
  ExportOrdersDto,
  HeadersExportOrdersDto,
} from './dto/export-order.dto';
import { GetOrderDto } from './dto/get-order.dto';

@Controller('orders')
@ApiTags('Orders')
@ApiBearerAuth()
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    @Inject('KafkaService') private kafkaProducer: KafkaService,
    @Inject('LogProvider') private logger: LogProvider,
  ) {
    this.logger.context = OrderController.name;
  }

  @Get()
  @ApiOkResponse({ type: PaginateOrderDto })
  async findAll(
    @Query(ValidationPipe) filterPaginateDto: FilterPaginateOrderDto,
    @Headers('x-tenant-id') xTenantId: string,
  ): Promise<PaginateOrderDto> {
    const {
      page = 1,
      perPage = 20,
      orderBy,
      orderDirection = 'desc',
      search,
      deliveryCompany,
      orderCreatedAtFrom,
      orderCreatedAtTo,
      orderUpdatedAtFrom,
      orderUpdatedAtTo,
      status,
      partnerStatus,
    } = filterPaginateDto;

    const pageNumber = Number(page);
    const pageSize = Number(perPage);
    const sortBy = orderBy || 'orderCreatedAt';

    const [resultQuery, count] = await this.orderService.findAll({
      page,
      pageSize,
      orderBy: sortBy,
      orderDirection,
      search,
      storeId: xTenantId,
      deliveryCompany,
      orderCreatedAtFrom,
      orderCreatedAtTo,
      orderUpdatedAtFrom,
      orderUpdatedAtTo,
      status,
      partnerStatus,
    });

    const result = resultQuery.map(order => ({
      ...order,
      logisticInfo: [order.logisticInfo[0]],
    }));

    return new PaginateOrderDto(
      JSON.parse(JSON.stringify(result)),
      count,
      pageNumber,
      pageSize,
    );
  }

  @Get(':id')
  @ApiOkResponse({ type: GetOrderDto })
  async findOne(@Param('id') id: string): Promise<GetOrderDto> {
    const order = await this.orderService.findOne(id);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return order;
  }

  @Post('/export')
  @UseGuards(JWTGuard)
  async exportOrders(
    @Query() exportOrdersDto: ExportOrdersDto,
    @Request() request: RequestDto,
    @Headers() headers: HeadersExportOrdersDto,
  ) {
    const { userId, userName, email } = request;
    const { orderCreatedAtFrom, orderCreatedAtTo } = exportOrdersDto;

    const filter = {
      orderCreatedAtFrom,
      orderCreatedAtTo,
      storeId: headers['x-tenant-id'],
    };

    await this.kafkaProducer.send(Env.KAFKA_TOPIC_FREIGHT_ORDERS_EXPORT, {
      headers: {
        'X-Correlation-Id': headers['x-correlation-id'] || uuidV4(),
        'X-Version': '1.0',
      },
      key: uuidV4(),
      value: JSON.stringify({
        data: {
          ...filter,
        },
        user: {
          id: userId,
          name: userName,
          email,
        },
      }),
    });
  }
}
