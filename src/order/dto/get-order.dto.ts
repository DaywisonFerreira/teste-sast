import { ApiProperty } from '@nestjs/swagger';
import { classToClass, plainToClass } from 'class-transformer';

export class GetOrderDto {
  @ApiProperty({
    description: 'Order id',
    type: String,
    example: '6126e04cc6151e00306b9820',
    required: true,
  })
  orderId: string;

  @ApiProperty({
    description: 'Order date of creation',
    type: Date,
    example: '2021-08-26T00:28:51.745+00:00',
    required: true,
  })
  orderCreatedAt: string;

  @ApiProperty({
    description: 'Receiver name of order',
    type: String,
    example: 'Lucas',
    required: true,
  })
  receiverName: string;

  @ApiProperty({
    description: 'Delivery company name',
    type: String,
    example: 'LOGGI',
    required: true,
  })
  deliveryCompany: string;

  @ApiProperty({
    description: 'Shipping Estimate Date',
    type: String,
    example: '2021-09-03T02:59:00.000Z',
    required: true,
  })
  shippingEstimateDate: string;

  @ApiProperty({
    description: 'Last update of order',
    type: String,
    example: '2021-08-27T12:55:03.805+00:00',
    required: true,
  })
  orderUpdatedAt: string;

  @ApiProperty({
    description: 'Order number in VTEX',
    type: String,
    example: 'MGZ-LU-1064670460620470',
    required: true,
  })
  orderSale: string;

  @ApiProperty({
    description: 'Order number in ERP',
    type: String,
    example: 'WEB-338326030',
    required: true,
  })
  order: string;

  @ApiProperty({
    description: 'Status of delivery',
    type: String,
    example: 'delivered',
    required: true,
  })
  status: string;

  @ApiProperty({
    description: 'Invoice value',
    type: Number,
    example: 1439.2,
    required: true,
  })
  invoiceValue: number;

  @ApiProperty({
    description: 'Tracking url of order',
    type: String,
    example:
      'https://status.ondeestameupedido.com/tracking/17359/WEB-338326030',
    required: true,
  })
  trackingUrl: string;

  @ApiProperty({
    description: 'History of status of order',
    type: Array,
    required: false,
  })
  history: Array<any>;

  public static factory(
    resultQuery: GetOrderDto | GetOrderDto[],
  ): GetOrderDto | GetOrderDto[] {
    const resultQueryDto = plainToClass(GetOrderDto, resultQuery, {
      ignoreDecorators: true,
    });

    return classToClass(resultQueryDto);
  }
}
