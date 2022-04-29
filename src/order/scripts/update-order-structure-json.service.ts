/* eslint-disable no-plusplus */
/* eslint-disable default-case */
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as jjv from 'jjv';
import { OrderDocument, OrderEntity } from '../schemas/order.schema';
import { newOrderSchema } from './schemas';

@Injectable()
export class UpdateStructureOrder {
  private readonly logger = new Logger(UpdateStructureOrder.name);

  constructor(
    @InjectModel(OrderEntity.name)
    private OrderModel: Model<OrderDocument>,
  ) {}

  async onModuleInit() {
    const orders = await this.OrderModel.find();
    const jsonSchema = jjv();
    jsonSchema.addSchema('order', newOrderSchema);
    await Promise.all(
      orders.map(order => this.validateOrder(order, jsonSchema)),
    );
  }

  private async validateOrder(
    order: OrderEntity,
    jsonSchema: jjv.Env,
  ): Promise<void> {
    const errors = jsonSchema.validate('order', order.toJSON());

    if (!errors) {
      this.logger.log('Order has been validated.');
    } else {
      this.logger.error(
        `Order ${
          order._id
        }: contains errors and will be checked ${JSON.stringify(errors)}`,
      );
      await this.checkAndUpdateOrder(order, errors);
    }
  }

  private async checkAndUpdateOrder(
    order: OrderEntity,
    errors: jjv.Errors,
  ): Promise<void> {
    this.logger.log('Order structure is being updated...');

    const { validation } = errors;
    const missingData: Partial<OrderEntity> = {};

    Object.keys(validation).forEach(error => {
      switch (error) {
        case 'invoice':
          if (order.billingData && order.billingData.length > 0) {
            const billingData = order.billingData[0];
            missingData.invoice = {
              serie: billingData.invoiceSerialNumber ?? '',
              value: billingData.invoiceValue ?? '',
              number: billingData.invoiceNumber ?? '',
              key: billingData.invoiceKey ?? '',
              issuanceDate: billingData.issuanceDate ?? '',
              carrierName: billingData.carrierName ?? '',
              trackingNumber: billingData.trackingNumber ?? '',
              trackingUrl: billingData.trackingUrl ?? '',
              items: billingData.items.map((item: any) => {
                return {
                  sku: item.sku,
                  quantity: item.quantity,
                  price: item.price,
                  isSubsidized: item.isSubsidized,
                };
              }),
            };
          }
          break;
        case 'customer': {
          let document = '';
          if (order.billingData && order.billingData.length > 0) {
            document = order.billingData[0].customerDocument;
          }
          missingData.customer = {
            phones: order.receiverPhones
              ? order.receiverPhones.map(phone => phone)
              : [],
            email: order.receiverEmail ?? '',
            isCorporate: false,
            firstName: order.receiverName
              ? order.receiverName.split(' ')[0]
              : '',
            lastName: order.receiverName
              ? order.receiverName.split(' ')[1]
              : '',
            document,
            documentType: 'cpf',
            corporateName: null,
            fullName: order.receiverName ?? '',
          };
          break;
        }
        case 'delivery':
          missingData.delivery = {
            receiverName: order.receiverName ?? '',
            city: order.deliveryCity ?? '',
            state: order.deliveryState ?? '',
            zipCode: order.deliveryZipCode ?? '',
            country: 'Brasil',
          };
          break;
        case 'statusCode':
          missingData.statusCode = {
            micro: '',
            macro: '',
          };
          break;
      }
    });

    if (!this.isEmpty(missingData)) {
      await this.OrderModel.findOneAndUpdate({ _id: order._id }, missingData, {
        useFindAndModify: false,
      });
      this.logger.log('Order structure changed successfully!');
    }
  }

  private isEmpty(obj: any) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  }
}
