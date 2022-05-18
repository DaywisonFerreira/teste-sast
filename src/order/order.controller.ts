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
import { UpdateStructureOrder } from './scripts/update-order-structure-json.service';
import { UpdateDuplicatedOrders } from './scripts/update-duplicated-orders.service';

@Controller('orders')
@ApiTags('Orders')
@ApiBearerAuth()
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    @Inject('KafkaService') private kafkaProducer: KafkaService,
    private readonly updateStructure: UpdateStructureOrder,
    private readonly updateDuplicated: UpdateDuplicatedOrders,
  ) {}

  @Get()
  @ApiOkResponse({ type: PaginateOrderDto })
  async findAll(
    @Query(ValidationPipe) filterPaginateDto: FilterPaginateOrderDto,
    @Headers('x-tenant-id') xTenantId: string,
    @Req() req: any,
  ): Promise<PaginateOrderDto> {
    try {
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
        statusCode,
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
        statusCode,
      });

      const result = resultQuery.map(order => ({
        ...order,
        customer: {
          ...order.customer,
          fullName: order.customer.fullName
            ? order.customer.fullName
            : `${order.customer.firstName} ${order.customer.lastName}`,
        },
        logisticInfo: [order.logisticInfo?.length ? order.logisticInfo[0] : {}],
      }));

      return new PaginateOrderDto(
        JSON.parse(JSON.stringify(result)),
        count,
        pageNumber,
        pageSize,
      );
    } catch (error) {
      req.logger.error(error);
      throw error;
    }
  }

  @Get(':id')
  @ApiOkResponse({ type: GetOrderDto })
  async findOne(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<GetOrderDto> {
    try {
      req.logger.verbose(`Request was received to get order ${id}`);
      return this.orderService.getOrderDetails(id);
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

  // @TODO: retirar antes de subir
  @Get('update-orders-structure')
  async updateOrderStructure(@Req() req: any): Promise<void> {
    try {
      req.logger.verbose(`Request was received to change order structure`);
      await this.updateStructure.updateStructureOrders();
    } catch (error) {
      req.logger.error(error);
      throw error;
    }
  }

  // @TODO: retirar antes de subir
  @Get('update-duplicated-orders')
  async updateDuplicatedOrders(@Req() req: any): Promise<void> {
    try {
      req.logger.verbose(`Request was received to update duplicated orders`);
      await this.updateDuplicated.updateDuplicateOrders();
    } catch (error) {
      req.logger.error(error);
      throw error;
    }
  }
}
