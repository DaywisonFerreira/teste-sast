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
import { OnEvent } from '@nestjs/event-emitter';
import { InfraLogger } from '@infralabs/infra-logger';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { existsSync, promises } from 'fs';
import { FilterPaginateOrderDto } from './dto/filter-paginate-order.dto';
import { PaginateOrderDto } from './dto/paginate-order.dto';
import { OrderService } from './order.service';
import {
  ExportOrdersDto,
  HeadersExportOrdersDto,
} from './dto/export-order.dto';
import { GetOrderDto } from './dto/get-order.dto';
import {
  ConsolidatedReportOrdersDTO,
  HeadersConsolidatedReportOrdersDTO,
} from './dto/consolidated-report-orders.dto';
import { NotificationTypes } from '../commons/enums/notification.enum';

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
    try {
      const {
        page = 1,
        perPage = 20,
        orderBy,
        orderDirection = 'desc',
        search,
        orderCreatedAtFrom,
        orderCreatedAtTo,
        shippingEstimateDateFrom,
        shippingEstimateDateTo,
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
        shippingEstimateDateFrom,
        shippingEstimateDateTo,
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
  @UseGuards(JWTGuard)
  @ApiOkResponse({ type: GetOrderDto })
  async findOne(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<GetOrderDto> {
    try {
      return this.orderService.getOrderDetails(id, req.tenants);
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
      const {
        orderCreatedAtFrom,
        orderCreatedAtTo,
        type = 'csv',
      } = exportOrdersDto;

      const filter = {
        orderCreatedAtFrom,
        orderCreatedAtTo,
        type,
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

  @Post('/consolidated-report')
  @UseGuards(JWTGuard)
  async consolidatedReportOrders(
    @Body() reportDTO: ConsolidatedReportOrdersDTO,
    @Request() request: RequestDto,
    @Headers() headers: HeadersConsolidatedReportOrdersDTO,
  ) {
    const { userId, userName, email, logger } = request;
    try {
      const { orderCreatedAtFrom, orderCreatedAtTo, tenants } = reportDTO;

      const filter = {
        orderCreatedAtFrom,
        orderCreatedAtTo,
        tenants,
      };

      await this.kafkaProducer.send(
        Env.KAFKA_TOPIC_FREIGHT_CONSOLIDATED_REPORT_ORDERS,
        {
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
        },
      );
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  @OnEvent('create.report.consolidated', { async: true })
  async createReportConsolidated({ data, headers, user, logger }) {
    let reportFilePath: any;
    logger.log(
      `${Env.KAFKA_TOPIC_FREIGHT_CONSOLIDATED_REPORT_ORDERS} - Report consolidated request by user ${user.id} was received - From ${data.orderCreatedAtFrom} to ${data.orderCreatedAtTo}`,
    );
    try {
      reportFilePath = await this.orderService.createReportConsolidated(data);
      if (reportFilePath) {
        const urlFile = await this.uploadFile(reportFilePath, headers);

        await this.kafkaProducer.send(
          Env.KAFKA_TOPIC_NOTIFY_MESSAGE_WEBSOCKET,
          {
            headers: {
              'X-Correlation-Id': headers['X-Correlation-Id'] || uuidV4(),
              'X-Version': '1.0',
            },
            value: {
              data: {
                to: user.id,
                origin: Env.APPLICATION_NAME,
                type: NotificationTypes.OrdersExport,
                payload: { urlFile },
              },
            },
          },
        );
      } else {
        logger.log('No records found for this account.');
      }
    } catch (error) {
      logger.error(error);
    } finally {
      if (reportFilePath && existsSync(reportFilePath.path)) {
        await this.deleteFileLocally(reportFilePath.path);
      }
    }
  }

  private async uploadFile(fileLocally: any, headers: any) {
    const logger = new InfraLogger(headers, OrderController.name);
    try {
      logger.log(`Starting file upload (${fileLocally.fileName})`);
      const credentials = new StorageSharedKeyCredential(
        Env.AZURE_ACCOUNT_NAME,
        Env.AZURE_ACCOUNT_KEY,
      );
      const blobServiceClient = new BlobServiceClient(
        Env.AZURE_BS_STORAGE_URL,
        credentials,
      );
      const containerClient = blobServiceClient.getContainerClient(
        Env.AZURE_BS_CONTAINER_NAME,
      );
      const blockBlobClient = containerClient.getBlockBlobClient(
        fileLocally.fileName,
      );
      await blockBlobClient.uploadFile(fileLocally.path);

      logger.log(`Finish file upload (${fileLocally.fileName})`);
      return `${String(Env.AZURE_BS_STORAGE_URL)}/${String(
        Env.AZURE_BS_CONTAINER_NAME,
      )}/${fileLocally.fileName}`;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  private async deleteFileLocally(path: string) {
    await promises.unlink(path);
  }
}
