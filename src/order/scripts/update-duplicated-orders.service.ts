import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { isBefore } from 'date-fns';
import { OrderDocument, OrderEntity } from '../schemas/order.schema';
import { HandleStatusCode } from './handle-status-code.service';

@Injectable()
export class UpdateDuplicatedOrders {
  private readonly logger = new Logger(UpdateDuplicatedOrders.name);

  constructor(
    @InjectModel(OrderEntity.name)
    private OrderModel: Model<OrderDocument>,
    private handleStatusCodeService: HandleStatusCode,
  ) {}

  async updateDuplicateOrders() {
    const duplicateValues = await this.OrderModel.aggregate([
      {
        $group: {
          _id: { orderSale: '$orderSale' },
          values: { $addToSet: '$_id' },
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ]);

    this.logger.log(
      `Found ${duplicateValues.length} orders with duplicate copies`,
    );

    for await (const order of duplicateValues) {
      this.logger.log(`Handle with orderSale: ${order._id.orderSale} copies`);
      const orders = await this.OrderModel.find({ _id: { $in: order.values } });
      const result = this.handleDuplicateKeys(orders);

      await this.OrderModel.deleteMany({ _id: { $in: result.toDelete } });

      await this.OrderModel.findOneAndUpdate(
        { _id: result.toSave._id },
        result.toSave,
        {
          useFindAndModify: false,
        },
      );
    }
  }

  handleDuplicateKeys(duplicateValues: Partial<OrderEntity>[]) {
    const [firstCreated] = duplicateValues.sort((a: any, b: any): any => {
      let dateOne = a.createdAt;
      let dateTwo = b.createdAt;
      if (typeof a.createdAt === 'string') {
        dateOne = new Date(a.createdAt);
      }

      if (typeof b.createdAt === 'string') {
        dateTwo = new Date(b.createdAt);
      }
      if (isBefore(dateOne, dateTwo)) {
        return -1;
      }
      return 1;
    });

    const [lastUpdated, ...rest] = duplicateValues.sort(
      (a: any, b: any): any => {
        let dateOne = a.orderUpdatedAt;
        let dateTwo = b.orderUpdatedAt;
        if (typeof a.orderUpdatedAt === 'string') {
          dateOne = new Date(a.orderUpdatedAt);
        }

        if (typeof b.orderUpdatedAt === 'string') {
          dateTwo = new Date(b.orderUpdatedAt);
        }
        if (isBefore(dateOne, dateTwo)) {
          return 1;
        }
        return -1;
      },
    );

    const { orderCreatedAt } = firstCreated;

    const historyToMerge = [];

    duplicateValues.forEach(order => {
      order.history.forEach(history => {
        const resultWithStatusCode = {
          ...history,
          statusCode: this.handleStatusCodeService.getStatusCode(
            history?.lastOccurrenceMicro,
          ),
        };
        historyToMerge.push(resultWithStatusCode);
      });
    });

    const sortHistory = historyToMerge.sort((a: any, b: any): any => {
      let dateOne = a.orderUpdatedAt;
      let dateTwo = b.orderUpdatedAt;
      if (typeof a.orderUpdatedAt === 'string') {
        dateOne = new Date(a.orderUpdatedAt);
      }

      if (typeof b.orderUpdatedAt === 'string') {
        dateTwo = new Date(b.orderUpdatedAt);
      }
      if (isBefore(new Date(dateOne), new Date(dateTwo))) {
        return -1;
      }
      return 1;
    });

    let result = {} as any;

    rest.forEach(item => {
      result = { ...item.toJSON() };
    });

    result = Object.assign(result, lastUpdated.toJSON());

    let invoice;
    let document;
    if (result.billingData && result.billingData.length > 0) {
      invoice = {
        serie: result.billingData[0].invoiceSerialNumber ?? '',
        value: result.billingData[0].invoiceValue ?? 0,
        number: result.billingData[0].invoiceNumber ?? '',
        key: result.billingData[0].invoiceKey ?? '',
        issuanceDate: result.billingData[0].issuanceDate ?? new Date(),
        carrierName: result.billingData[0].carrierName ?? '',
        trackingNumber: result.billingData[0].trackingNumber ?? '',
        trackingUrl: result.billingData[0].trackingUrl ?? '',
        items: result.billingData[0].items.map((item: any) => {
          return {
            sku: item.sku,
            quantity: item.quantity,
            price: item.price,
            isSubsidized: item.isSubsidized ?? false,
          };
        }),
      };
    } else {
      invoice = {
        serie: '',
        value: 0,
        number: '',
        key: '',
        // eslint-disable-next-line
        // @ts-ignore
        issuanceDate: '',
        carrierName: '',
        trackingNumber: '',
        trackingUrl: '',
        items: [
          {
            sku: '',
            quantity: 0,
            price: 0,
            isSubsidized: false,
          },
        ],
      };
    }

    if (result.billingData && result.billingData.length > 0) {
      document = result.billingData[0].customerDocument || '';
    }
    const customer = {
      phones: result.receiverPhones
        ? result.receiverPhones.map(phone => ({
            phone: `${phone.phone}`,
            type: phone.type,
          }))
        : [{ phone: '', type: '' }],
      email: result.receiverEmail ?? '',
      isCorporate: false,
      firstName: result.receiverName ? result.receiverName.split(' ')[0] : '',
      // eslint-disable-next-line
      lastName: result.receiverName
        ? result.receiverName.split(' ')[1]
          ? result.receiverName.split(' ')[1]
          : ''
        : '',
      document,
      documentType: 'cpf',
      corporateName: '',
      fullName: result.receiverName ?? '',
    };

    const delivery = {
      receiverName: result.receiverName ?? '',
      city: result.deliveryCity ?? '',
      state: result.deliveryState ?? '',
      zipCode: result.deliveryZipCode ?? '',
      country: 'BRA',
    };

    const toSave = {
      ...result,
      invoice,
      customer,
      delivery,
      history: sortHistory,
      orderCreatedAt,
      statusCode: this.handleStatusCodeService.getStatusCode(
        result.lastOccurrenceMicro,
        result.status,
      ),
    };

    return {
      toSave,
      toDelete: rest.filter(item => item._id !== toSave._id),
    };
  }
}
