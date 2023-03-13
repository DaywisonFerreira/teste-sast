import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as jjv from 'jjv';
import { chunkArray } from 'src/commons/utils/array.utils';
import { OrderDocument, OrderEntity } from '../schemas/order.schema';
import { newOrderSchema } from './schemas/schemaOrderRootRequired';
import { HandleStatusCode } from './handle-status-code.service';
import { UpdateDuplicatedOrders } from './update-duplicated-orders.service';

@Injectable()
export class UpdateStructureOrder {
  private readonly logger = new Logger(UpdateStructureOrder.name);

  constructor(
    @InjectModel(OrderEntity.name) private OrderModel: Model<OrderDocument>,
    private updateDuplicatedOrdersService: UpdateDuplicatedOrders,
    private handleStatusCodeService: HandleStatusCode,
  ) {}

  async updateStructureOrders() {
    const ordersToMigrateFilter = {
      // 'statusCode.macro': '',
      statusCode: null,
      // 'invoice.key': null,
      // 'invoice.key': ''
    };
    const count = await this.OrderModel.countDocuments(ordersToMigrateFilter);

    const size = 2000;
    const pages = Math.ceil(count / size);

    const jsonSchema = jjv();
    jsonSchema.addSchema('order', newOrderSchema);

    this.logger.log(`TOTAL: ${count}`);

    const result = { success: 0, errors: 0 };

    // eslint-disable-next-line
    for (let index = 0; index < pages; index++) {
      // eslint-disable-next-line no-await-in-loop
      const orders = await this.OrderModel.find(ordersToMigrateFilter)
        .limit(size)
        .skip(index * size);

      this.logger.log(
        `Start ${orders.length} records, part ${index + 1}/${pages}`,
      );

      const chunkOrders = chunkArray(orders, size / 10);
      // eslint-disable-next-line no-await-in-loop
      for await (const orders of chunkOrders) {
        await Promise.all(
          orders.map(async order => {
            const validation = await this.validateOrder(
              order.toJSON(),
              jsonSchema,
            );
            if (validation) {
              // eslint-disable-next-line
              result.success++;
            } else {
              // eslint-disable-next-line
              result.errors++;
            }
          }),
        );
      }
      this.logger.log(
        `Finish part ${index + 1}/${pages} with totals: ${
          result.success
        } updated, ${result.errors} already updated`,
      );
    }
  }

  private async validateOrder(
    order: OrderEntity,
    jsonSchema: jjv.Env,
  ): Promise<boolean> {
    const errors = jsonSchema.validate('order', order, {
      checkRequired: true,
    });

    if (!errors) {
      return false;
    }
    return this.checkAndUpdateOrder(order, errors);
  }

  private async checkAndUpdateOrder(
    order: OrderEntity,
    errors: jjv.Errors,
  ): Promise<boolean> {
    const { validation } = errors;
    const missingData: Partial<OrderEntity> = {};
    let document = '';

    missingData.migrated = false;
    missingData.migrationLog = null;

    Object.keys(validation).forEach(error => {
      // eslint-disable-next-line
      switch (error) {
        case 'invoice':
          if (order.billingData && order.billingData.length > 0) {
            const billingData = order.billingData[0];
            missingData.invoice = {
              serie: billingData.invoiceSerialNumber ?? '',
              value: billingData.invoiceValue ?? 0,
              number: billingData.invoiceNumber ?? '',
              key: billingData.invoiceKey ?? '',
              issuanceDate: billingData.issuanceDate ?? new Date(),
              carrierName: billingData.carrierName ?? '',
              trackingNumber: billingData.trackingNumber ?? '',
              trackingUrl: billingData.trackingUrl ?? '',
              items: billingData.items.map((item: any) => {
                return {
                  sku: item.sku,
                  quantity: item.quantity,
                  price: item.price,
                  isSubsidized: item.isSubsidized ?? false,
                };
              }),
            };
          } else {
            missingData.invoice = {
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
          break;
        case 'customer':
          if (order.billingData && order.billingData.length > 0) {
            document = order.billingData[0].customerDocument || '';
          }
          missingData.customer = {
            phones: order.receiverPhones
              ? order.receiverPhones.map(phone => ({
                  phone: `${phone.phone}`,
                  type: phone.type,
                }))
              : [{ phone: '', type: '' }],
            email: order.receiverEmail ?? '',
            isCorporate: false,
            firstName: order.receiverName
              ? order.receiverName.split(' ')[0]
              : '',
            // eslint-disable-next-line
            lastName: order.receiverName
              ? order.receiverName.split(' ')[1]
                ? order.receiverName.split(' ')[1]
                : ''
              : '',
            document,
            documentType: 'cpf',
            corporateName: '',
            fullName: order.receiverName ?? '',
          };
          break;
        case 'delivery':
          missingData.delivery = {
            receiverName: order.receiverName ?? '',
            city: order.deliveryCity ?? '',
            state: order.deliveryState ?? '',
            zipCode: order.deliveryZipCode ?? '',
            country: 'BRA',
          };
          break;
        case 'statusCode':
          missingData.statusCode = this.handleStatusCodeService.getStatusCode(
            order.lastOccurrenceMicro,
            order.status,
          );
          break;
        case 'history':
          if (order?.history && order?.history.length > 0) {
            missingData.history = order.history.map(item => ({
              ...item,
              statusCode: this.handleStatusCodeService.getStatusCode(
                item?.lastOccurrenceMicro,
                order?.status,
              ),
            }));
          } else {
            missingData.history = [
              {
                volumeNumber: order.volumeNumber ? order.volumeNumber : 0,
                // eslint-disable-next-line
                // @ts-ignore
                dispatchDate: order.dispatchDate ?? '',
                // eslint-disable-next-line
                // @ts-ignore
                estimateDeliveryDateDeliveryCompany:
                  order.estimateDeliveryDateDeliveryCompany ?? '',
                partnerMessage: order.partnerMessage ?? '',
                microStatus: order.microStatus ?? '',
                lastOccurrenceMacro: order.lastOccurrenceMacro ?? '',
                lastOccurrenceMicro: order.lastOccurrenceMicro ?? '',
                lastOccurrenceMessage: order.lastOccurrenceMessage ?? '',
                partnerStatusId: order.partnerStatusId ?? '',
                partnerStatus: order.partnerStatus ?? '',
                statusCode: this.handleStatusCodeService.getStatusCode(
                  order?.lastOccurrenceMicro,
                  order?.status,
                ),
                // eslint-disable-next-line
                // @ts-ignore
                orderUpdatedAt: order.orderUpdatedAt ?? '',
                i18n: order.i18n ?? '',
              },
            ];
          }
          break;
        case 'totals':
          if (order?.totals && order?.totals.length > 0) {
            missingData.totals = order.totals;
          } else {
            missingData.totals = [
              {
                id: 'Items',
                name: 'Total dos Itens',
                value: 0,
              },
              {
                id: 'Discounts',
                name: 'Total dos Descontos',
                value: 0,
              },
              {
                id: 'Shipping',
                name: 'Total do Frete',
                value: 0,
              },
            ];
          }
          break;
      }
    });

    if (!this.isEmpty(missingData)) {
      try {
        await this.OrderModel.findOneAndUpdate(
          { _id: order._id },
          missingData,
          {
            useFindAndModify: false,
          },
        );
        return true;
      } catch (error) {
        this.logger.error(error);
        if (error.message.includes('E11000')) {
          const resultToMerge = await this.OrderModel.find({
            orderSale: order.orderSale,
          });
          const result =
            this.updateDuplicatedOrdersService.handleDuplicateKeys(
              resultToMerge,
            );
          await this.OrderModel.deleteMany({ _id: { $in: result.toDelete } });

          await this.OrderModel.findOneAndUpdate(
            { _id: result.toSave._id },
            result.toSave,
            {
              useFindAndModify: false,
            },
          );
        }
        return true;
      }
    } else {
      return false;
    }
  }

  private isEmpty(obj: any) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  }
}
