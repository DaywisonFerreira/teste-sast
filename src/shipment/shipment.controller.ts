import {
  Controller,
  Headers,
  Inject,
  Body,
  Request,
  UseGuards,
  Put,
  Response,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { LogProvider } from 'src/commons/providers/log/log-provider.interface';
import { JWTGuard } from 'src/commons/guards/jwt.guard';
import { RequestDto } from 'src/commons/dtos/request.dto';
import { OriginEnum } from 'src/commons/enums/origin-enum';
import { OrderService } from 'src/order/order.service';
import {
  HeadersUpdateOrderStatusDTO,
  UpdateOrderStatusDto,
} from './dto/update-order-status.dto';

@Controller('shipment')
@ApiTags('Shipment')
@ApiBearerAuth()
export class ShipmentController {
  constructor(
    private readonly orderService: OrderService,
    @Inject('LogProvider')
    private readonly logger: LogProvider,
  ) {
    this.logger.instanceLogger(ShipmentController.name);
  }

  @Put('orders/update-status')
  @UseGuards(JWTGuard)
  @ApiOperation({ summary: 'Update Order Status' })
  async updateOrdersStatus(
    @Body() input: UpdateOrderStatusDto,
    @Request() request: RequestDto,
    @Headers() headers: HeadersUpdateOrderStatusDTO,
    @Response() res,
  ): Promise<any> {
    const orders = input.data.map(order => order.orderNumber);
    try {
      this.logger.log({
        key: 'ifc.freight.api.order.shipment.controller.updateOrdersStatus',
        message: `Received status update for orders: ${orders} from account: ${headers['x-tenant-id']} `,
      });
      const response = [];

      for await (const order of input.data) {
        const updateStatusData = {
          tracking: {
            sequentialCode: order.invoiceKey,
            provider: {
              status: order.statusCode.description,
            },
            statusCode: {
              micro: order.statusCode.micro,
              macro: order.statusCode.macro,
            },
            attachments: [],
            eventDate: new Date(),
            reason: order?.reason,
            additionalInfo: order?.additionalInfo,
            author: {
              id: request.userId,
              name: request.userName,
            },
          },
        };

        const result = await this.orderService.updateOrderStatus(
          updateStatusData,
          headers,
          OriginEnum.DELIVERY_HUB,
        );

        const orderResponse: any = {
          orderNumber: order.orderNumber,
          statusCode: {
            macro: order.statusCode.macro,
            micro: order.statusCode.micro,
            description: order.statusCode.description,
          },
          additionalInfo: order?.additionalInfo,
          reason: order?.reason,
        };

        if (!result.success) {
          orderResponse.error = {
            code: 'freight/status-not-changed',
            detail: 'Order with finisher status',
          };
        }

        response.push(orderResponse);
      }
      return res.send({ data: response });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
