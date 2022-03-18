/* eslint-disable import/named */
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
  Body,
  Request,
  UseGuards,
  ValidationPipe,
  Req,
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
  ) {}

  @Get()
  @ApiOkResponse({ type: PaginateOrderDto })
  async findAll(
    @Query(ValidationPipe) filterPaginateDto: FilterPaginateOrderDto,
    @Headers('x-tenant-id') xTenantId: string,
    @Req() req: any,
  ): Promise<PaginateOrderDto> {
    req.logger.verbose(
      `A request was received to get all orders with the query: ${JSON.stringify(
        filterPaginateDto,
      )}`,
    );
    const {
      page = 1,
      perPage = 20,
      orderBy,
      orderDirection = 'desc',
      search,
      orderCreatedAtFrom,
      orderCreatedAtTo,
      orderUpdatedAtFrom,
      orderUpdatedAtTo,
      status,
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
      orderCreatedAtFrom,
      orderCreatedAtTo,
      orderUpdatedAtFrom,
      orderUpdatedAtTo,
      status,
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
  async findOne(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<GetOrderDto> {
    try {
      req.logger.verbose(`Request was received to get order ${id}`);
      const order = await this.orderService.findOne(id);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return order;
    } catch (error) {
      req.logger.error(error);
      throw error;
    }
  }

  @Post('/export')
  @UseGuards(JWTGuard)
  async exportOrders(
    @Body() exportOrdersDto: ExportOrdersDto,
    @Request() request: RequestDto,
    @Headers() headers: HeadersExportOrdersDto,
  ) {
    const { userId, userName, email, logger } = request;
    try {
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
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }
}
