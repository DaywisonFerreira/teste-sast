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
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { existsSync, promises } from 'fs';
import { differenceInDays, isBefore } from 'date-fns';
import { LogProvider } from 'src/commons/providers/log/log-provider.interface';
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
import { buildOrderNotFoundMessage } from './utils/helpers';
import { AccountService } from '../account/account.service';
import { OrderProducer } from './producer/order.producer';

@Controller('orders')
@ApiTags('Orders')
@ApiBearerAuth()
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly accountService: AccountService,
    @Inject('KafkaService') private kafkaProducer: KafkaService,
    @Inject('LogProvider')
    private readonly logger: LogProvider,
    private orderProducer: OrderProducer,
  ) {
    this.logger.instanceLogger(OrderController.name);
  }

  @Get()
  @ApiOkResponse({ type: PaginateOrderDto })
  async findAll(
    @Query(ValidationPipe) filterPaginateDto: FilterPaginateOrderDto,
    @Headers('x-tenant-id') xTenantId: string,
  ): Promise<PaginateOrderDto> {
    try {
      this.logger.log(
        {
          key: 'ifc.freight.api.order.order-controller.findAll',
          message: `Find all orders from tenant ${xTenantId}`,
        },
        {},
      );
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
        orderNumbers,
      } = filterPaginateDto;
      let filterPartnerOrdersOrOrderSale = [];
      let partnerOrdersOrOrderSaleNotFound = [];

      const pageNumber = Number(page);
      const pageSize = Number(perPage);
      const sortBy = orderBy || 'orderCreatedAt';

      if (orderNumbers && orderNumbers.length) {
        filterPartnerOrdersOrOrderSale = orderNumbers
          .split(',')
          .map(partnerOrder => partnerOrder.trim());
      }

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
        filterPartnerOrdersOrOrderSale,
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

      if (filterPartnerOrdersOrOrderSale.length) {
        partnerOrdersOrOrderSaleNotFound =
          filterPartnerOrdersOrOrderSale.filter(
            order =>
              !result.find(
                el =>
                  el.partnerOrder.toString() === order.toString() ||
                  el.orderSale.toString() === order.toString(),
              ),
          );
      }

      const metatada = partnerOrdersOrOrderSaleNotFound.length
        ? buildOrderNotFoundMessage(partnerOrdersOrOrderSaleNotFound)
        : undefined;

      return new PaginateOrderDto(
        JSON.parse(JSON.stringify(result)),
        count,
        pageNumber,
        pageSize,
        metatada,
      );
    } catch (error) {
      this.logger.error(error);
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
    this.logger.log(
      {
        key: 'ifc.freight.api.order.order-controller.findOne',
        message: `Find order id: ${id}`,
      },
      {},
    );
    try {
      return this.orderService.getOrderDetails(id, req.tenants);
    } catch (error) {
      this.logger.error(error);
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
    this.logger.log(
      {
        key: 'ifc.freight.api.order.order-controller.exportOrders',
        message: `Export orders from ${headers['x-tenant-id']} `,
      },
      headers,
    );
    const { userId, userName, email } = request;
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
      this.logger.error(error);
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
    this.logger.log(
      {
        key: 'ifc.freight.api.order.order-controller.consolidatedReportOrders',
        message: `Consolidated Report from userid: ${request.userId}`,
      },
      headers,
    );
    const { userId, userName, email } = request;
    try {
      const { orderCreatedAtFrom, orderCreatedAtTo, tenants } = reportDTO;

      if (
        isBefore(
          new Date(`${orderCreatedAtTo} 23:59:59-03:00`),
          new Date(`${orderCreatedAtFrom} 00:00:00-03:00`),
        )
      ) {
        throw new Error('Invalid range of dates');
      }

      if (
        differenceInDays(
          new Date(`${orderCreatedAtTo} 23:59:59-03:00`),
          new Date(`${orderCreatedAtFrom} 00:00:00-03:00`),
        ) > 120
      ) {
        throw new Error('Date difference greater than 4 months');
      }

      const accounts = await this.accountService.find({
        id: { $in: tenants },
        useDeliveryHubStandalone: true,
      });

      if (!accounts.length) {
        throw new Error('No accounts available to create report');
      }

      const filter = {
        orderCreatedAtFrom,
        orderCreatedAtTo,
        tenants: accounts.map(acc => acc.id),
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
      this.logger.error(error);
      throw error;
    }
  }

  @OnEvent('create.report.consolidated', { async: true })
  async createReportConsolidated({ data, headers, user }) {
    this.logger.log(
      {
        key: 'ifc.freight.api.order.order-controller.createReportConsolidated',
        message: `${Env.KAFKA_TOPIC_FREIGHT_CONSOLIDATED_REPORT_ORDERS} - Report consolidated request by user ${user.id} was received - From ${data.orderCreatedAtFrom} to ${data.orderCreatedAtTo}`,
      },
      headers,
    );
    let reportFilePath: { path: string; fileName: string };

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
        this.logger.log(
          {
            key: 'ifc.freight.api.order.order-controller.createReportConsolidated.no-records',
            message: 'No records found for this account.',
          },
          headers,
        );
      }
    } catch (error) {
      this.logger.error(error);
    } finally {
      if (reportFilePath && existsSync(reportFilePath.path)) {
        await this.deleteFileLocally(reportFilePath.path);
      }
    }
  }

  private async uploadFile(fileLocally: any, headers: any) {
    this.logger.log(
      {
        key: 'ifc.freight.api.order.order-controller.uploadFile.start',
        message: `Starting file upload (${fileLocally.fileName})`,
      },
      headers,
    );
    try {
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

      this.logger.log(
        {
          key: 'ifc.freight.api.order.order-controller.uploadFile.finish',
          message: `Finish file upload (${fileLocally.fileName})`,
        },
        headers,
      );

      return `${String(Env.AZURE_BS_STORAGE_URL)}/${String(
        Env.AZURE_BS_CONTAINER_NAME,
      )}/${fileLocally.fileName}`;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  private async deleteFileLocally(path: string) {
    await promises.unlink(path);
  }

  // update ihub
  @Post('ihub/send-dispatched-status')
  async sendDispatchedEvent(@Body() ordersSale: string[]) {

    const ordersList = await this.orderService.findOrdersToDispatch(ordersSale);

    for await (const order of ordersList) {
      if(order.history.length > 1) {
        const dispatchedDate = order.history[1].orderUpdatedAt;

        const data = {
          ...order,
          orderUpdatedAt: dispatchedDate,
          partnerMessage: 'DESPACHADO',
          microStatus: 'DESPACHADO',
          lastOccurrenceMacro: 'order-dispatched',
          lastOccurrenceMicro: 'dispatched',
          lastOccurrenceMessage: 'DESPACHADO',
          partnerStatus: 'DESPACHADO'.toLowerCase(),
          i18n: 'order-dispatched',
          statusCode: {
            micro: 'dispatched',
            macro: 'order-dispatched',
          },
      }
      this.logger.log(`Send dispatched status to Ihub from orderSale: ${order.orderSale}`)
      await this.orderProducer.sendStatusTrackingToIHub(data);
    }

  }
  }

  @Post('ihub/send-delivered-status')
  async sendDelivered(@Body() ordersSale: string[]) {

    const ordersList = await this.orderService.findOrdersToDelivered(ordersSale);

    for await (const order of ordersList) {
      const deliveredDate = order.history[order.history.length - 1].orderUpdatedAt;

      const data = {
        ...order,
        orderUpdatedAt: deliveredDate,
        partnerMessage: 'ENTREGA REALIZADA',
        microStatus: 'ENTREGA REALIZADA',
        lastOccurrenceMacro: 'delivered',
        lastOccurrenceMicro: 'delivered-success',
        lastOccurrenceMessage: 'ENTREGA REALIZADA',
        partnerStatus: 'ENTREGA REALIZADA'.toLowerCase(),
        i18n: 'delivered',
        statusCode: {
          micro: 'delivered-success',
          macro: 'delivered',
        },
    }
    this.logger.log(`Send delivered success status to Ihub from orderSale: ${order.orderSale}`)
    await this.orderProducer.sendStatusTrackingToIHub(data);
  }
  }


}
