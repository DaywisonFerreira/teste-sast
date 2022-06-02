import { Types } from 'mongoose';
import { CreateIntelipost } from 'src/intelipost/dto/create-intelipost.dto';
import { createBlobService } from 'azure-storage';
import axios from 'axios';
import { promises, createWriteStream } from 'fs';
import { IHubOrder } from '../interfaces/order.interface';
import { OrderDocument } from '../schemas/order.schema';
import { Env } from '../../commons/environment/env';

interface OrderAnalysis {
  id?: string;
  accountName?: string;
  accountId?: string;
  orderSale?: string;
  orderUpdatedAt?: Date;
  orderCreatedAt?: Date;
  shippingEstimateDate?: Date;
  statusCode?: {
    micro: string;
    macro: string;
  };
  invoice?: {
    value: number;
  };
  carrier?: {
    name?: string;
    document?: string;
  };
  customer?: {
    firstName: string;
    lastName: string;
    document: string;
    documentType: string;
  };
  deliveryDate?: Date;
  trackingUrl?: string;
}
export class OrderMapper {
  static async mapPartnerToOrder(
    payload: CreateIntelipost,
  ): Promise<Partial<OrderDocument>> {
    const status =
      typeof payload.history.shipment_order_volume_state === 'string'
        ? payload.history.shipment_order_volume_state
            .toLowerCase()
            .replace(/_/g, '-')
        : payload.history.shipment_order_volume_state;

    const statusCode = this.mapStatusCode(payload);

    return {
      orderSale: payload.sales_order_number,
      partnerOrder: payload.order_number,
      orderUpdatedAt: new Date(payload.history.event_date_iso),
      invoiceKeys: [payload.invoice.invoice_key],
      invoice: {
        key: payload.invoice.invoice_key,
        serie: payload.invoice.invoice_series,
        number: payload.invoice.invoice_number,
        trackingUrl: payload.tracking_url,
        trackingNumber: payload.tracking_code,
        carrierName: payload.invoice.carrierName,
        carrierDocument: payload.invoice.carrierDocument,
      },
      estimateDeliveryDateDeliveryCompany: payload?.estimated_delivery_date
        ?.client
        ? new Date(payload.estimated_delivery_date.client.current_iso)
        : null,
      partnerMessage: payload.history.provider_message,
      partnerStatusId: `${payload.history.shipment_volume_micro_state.id}`,
      partnerMacroStatusId: `${payload.history.shipment_volume_micro_state.shipment_order_volume_state_id}`,
      numberVolumes: parseInt(payload.volume_number, 10),
      volumeNumber: parseInt(payload.volume_number, 10),
      microStatus: payload.history.shipment_volume_micro_state.name,
      lastOccurrenceMacro: payload.history.esprinter_message,
      lastOccurrenceMicro:
        payload.history.shipment_volume_micro_state.default_name,
      lastOccurrenceMessage:
        payload.history.shipment_volume_micro_state.description,
      partnerStatus: status,
      i18n: payload.history.shipment_volume_micro_state.i18n_name,
      statusCode,
    };
  }

  static async mapAttachment(attachment, invoiceKey) {
    if (attachment.type === 'POD') {
      const fileName = `pod-${invoiceKey}${attachment.file_name}`;

      const downloadedUrl = await OrderMapper.downloadFromCloud(
        attachment.url,
        fileName,
      );

      const uploadedUrl = await OrderMapper.uploadToCloud(
        fileName,
        downloadedUrl,
      );

      OrderMapper.deleteFileLocally(downloadedUrl);

      return {
        fileName,
        mimeType: attachment.mime_type,
        type: attachment.type,
        additionalInfo: attachment.additionalInfo,
        url: uploadedUrl,
        originalUrl: attachment.url,
        createdAt: attachment.created_iso,
      };
    }
    return {};
  }

  static downloadFromCloud(url: string, fileName: string): Promise<string> {
    const pathDestination =
      Env.NODE_ENV !== 'local'
        ? `${process.cwd()}/dist/tmp`
        : `${process.cwd()}/src/tmp`;

    return axios({
      method: 'GET',
      url,
      responseType: 'stream',
    }).then(
      (response: any) =>
        new Promise((resolve, reject) => {
          const writer = response.data.pipe(
            createWriteStream(`${pathDestination}/${fileName}`),
          );
          writer.on('error', error => reject(error));
          writer.on('finish', () => resolve(`${pathDestination}/${fileName}`));
        }),
    );
  }

  static uploadToCloud(fileName: string, path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const blobSvc = createBlobService(Env.AZURE_BS_ACCESS_KEY);
      blobSvc.createBlockBlobFromLocalFile(
        String(Env.AZURE_BS_CONTAINER_NAME),
        fileName,
        path,
        error => {
          if (error) {
            reject(error);
          }
          resolve(
            `${String(Env.AZURE_BS_STORAGE_URL)}/${String(
              Env.AZURE_BS_CONTAINER_NAME,
            )}/${fileName}`,
          );
        },
      );
    });
  }

  static deleteFileLocally(path: string) {
    promises.unlink(path);
  }

  static mapStatusCode(payload: any) {
    const MapperMicroStatus = {
      created: [
        '575',
        '67',
        '574',
        '412',
        '413',
        '273',
        '271',
        '268',
        '267',
        '426',
        '428',
        '429',
        '430',
        '264',
        '461',
        '314',
        '315',
        '317',
        '318',
      ],
      'operational-problem': [
        '576',
        '580',
        '581',
        '475',
        '358',
        '361',
        '363',
        '364',
        '373',
        '374',
        '380',
        '353',
        '354',
        '394',
        '395',
        '396',
        '415',
        '416',
        '417',
        '47',
        '256',
        '260',
        '41',
        '334',
        '28',
        '44',
        '51',
        '55',
        '66',
        '74',
        '21',
        '35',
        '52',
        '58',
        '250',
        '134',
        '138',
        '254',
        '78',
        '205',
        '213',
        '222',
        '319',
        '326',
        '224',
        '226',
        '228',
        '232',
        '237',
      ],
      'carrier-possession': [
        '577',
        '360',
        '359',
        '434',
        '262',
        '2',
        '371',
        '282',
        '283',
        '375',
        '376',
        '377',
        '378',
        '379',
        '382',
        '397',
        '411',
        '424',
        '425',
        '29',
        '130',
        '16',
        '10',
        '131',
        '11',
        '17',
        '12',
        '272',
        '80',
        '257',
        '211',
        '210',
        '14',
        '18',
        '20',
        '234',
        '284',
        '286',
        '287',
        '288',
        '313',
        '285',
        '248',
        '145',
        '338',
        '75',
        '339',
        '53',
        '7',
        '56',
        '68',
        '251',
        '129',
        '135',
        '136',
        '253',
        '255',
        '206',
        '209',
        '220',
        '321',
      ],
      'first-delivery-failed': [
        '579',
        '362',
        '372',
        '263',
        '387',
        '388',
        '410',
        '34',
        '42',
        '1',
        '217',
        '208',
        '5',
        '291',
        '292',
        '290',
        '289',
        '30',
        '31',
        '32',
        '40',
        '141',
        '57',
        '27',
        '46',
        '79',
        '132',
        '133',
        '54',
        '200',
        '203',
        '214',
        '215',
        '216',
        '229',
        '233',
      ],
      'address-error': ['578', '72'],
      'shippment-loss': [
        '356',
        '365',
        '367',
        '366',
        '369',
        '368',
        '370',
        '399',
        '400',
        '401',
        '402',
        '403',
        '404',
        '405',
        '406',
        '64',
        '249',
        '128',
        '121',
      ],
      'hub-transfer': ['15', '3', '9', '199', '204', '201', '207', '316'],
      'delivery-route': ['118', '59', '6', '140', '225', '320', '231'],
      'shippment-returned': ['381', '126', '63', '312', '448'],
      'zip-code-not-serviced': ['383', '391', '23', '212'],
      'customer-refused': ['384', '385', '386', '398', '409', '24', '227'],
      'address-not-found': [
        '389',
        '390',
        '392',
        '39',
        '70',
        '37',
        '36',
        '218',
        '235',
      ],
      'away-customer': ['393', '139', '25', '43', '221', '239'],
      'shippment-stolen': ['407', '408', '279', '65', '230'],
      'tax-stop': ['420', '418', '419', '48', '144'],
      dispatched: ['421', '445', '13', '197', '198', '69'],
      'shippment-returning': [
        '423',
        '277',
        '19',
        '329',
        '330',
        '331',
        '332',
        '333',
        '323',
        '293',
        '294',
        '295',
        '296',
        '297',
        '298',
        '299',
        '300',
        '301',
        '302',
        '303',
        '304',
        '305',
        '306',
        '307',
        '308',
        '309',
        '311',
        '310',
        '325',
        '127',
        '49',
        '50',
      ],
      'delivered-success': ['125', '60', '4', '61', '202', '252'],
      'waiting-post-office-pickup': ['261', '124', '22', '108', '122', '223'],
      damage: ['278', '62', '119', '137'],
      'unknown-customer': ['33', '38', '26', '236', '238'],
      invoiced: [],
    };
    const statusCode = { micro: '', macro: '' };

    Object.keys(MapperMicroStatus).map(status => {
      if (
        MapperMicroStatus[status].find(
          statusId =>
            `${payload.history.shipment_volume_micro_state.id}` === statusId,
        )
      ) {
        statusCode.micro = status;
      }

      return statusCode;
    });

    const MapperMacroStatus = {
      'order-created': ['1', '4', '8', '17', '18', '5', '6'],
      'in-transit': ['12', '30000'],
      'delivery-failed': ['10', '13', '2'],
      delivered: ['14'],
      canceled: ['7', '19'],
      'out-of-delivery': ['16'],
      'order-dispatched': ['9'],
    };

    Object.keys(MapperMacroStatus).map(statusMacro => {
      if (
        MapperMacroStatus[statusMacro].find(
          macroStatusId =>
            `${payload.history.shipment_volume_micro_state.shipment_order_volume_state_id}` ===
            macroStatusId,
        )
      ) {
        statusCode.macro = statusMacro;
      }
      return statusCode;
    });

    return statusCode;
  }

  static mapPartnerHistoryToOrderHistory(payload: Partial<OrderDocument>): any {
    const statusCode = this.mapStatusCode({
      history: {
        shipment_volume_micro_state: {
          id: payload.partnerStatusId,
          shipment_order_volume_state_id: payload.partnerMacroStatusId,
        },
      },
    });

    return {
      volumeNumber: payload.volumeNumber,
      dispatchDate: payload.dispatchDate,
      estimateDeliveryDateDeliveryCompany:
        payload.estimateDeliveryDateDeliveryCompany,
      partnerMessage: payload.partnerMessage,
      microStatus: payload.microStatus,
      lastOccurrenceMacro: payload.lastOccurrenceMacro,
      lastOccurrenceMicro: payload.lastOccurrenceMicro,
      lastOccurrenceMessage: payload.lastOccurrenceMessage,
      partnerStatusId: payload.partnerStatusId,
      partnerStatus: payload.partnerStatus,
      statusCode,
      orderUpdatedAt: payload.orderUpdatedAt,
      i18n: payload.i18n,
    };
  }

  static mapPartnerToExportingOrder(payload: Partial<OrderDocument>): any {
    const i18nName =
      typeof payload.i18n === 'string'
        ? payload.i18n.toLowerCase().replace(/_/g, '-')
        : payload.i18n;

    return {
      storeId: payload.storeId,
      storeCode: payload.storeCode,
      externalOrderId: payload.orderSale,
      internalOrderId: parseInt(payload.internalOrderId, 10),
      shippingEstimateDate: payload.estimateDeliveryDateDeliveryCompany,
      eventDate: payload.orderUpdatedAt,
      partnerMessage: payload.partnerMessage,
      numberVolumes: payload.numberVolumes,
      microStatus: payload.microStatus,
      occurrenceMacro: payload.lastOccurrenceMacro,
      occurrenceMicro: payload.lastOccurrenceMicro,
      occurrenceMessage: payload.lastOccurrenceMessage,
      partnerStatus: payload.partnerStatus,
      i18nName: i18nName === 'cancelled' ? 'canceled' : i18nName,
      status:
        payload.partnerStatus === 'cancelled'
          ? 'canceled'
          : payload.partnerStatus,
      invoiceNumber: payload.invoice.number,
      trackingNumber: payload.invoice.trackingNumber,
      trackingUrl: payload.invoice.trackingUrl,
      carrierName: payload.invoice.carrierName,
    };
  }

  static mapMessageToOrders(payload: IHubOrder): Array<Partial<OrderDocument>> {
    const {
      _id: orderId,
      deliveryAddress,
      erpInfo,
      externalOrderId,
      packageAttachment,
      logisticInfo: logisticInfoRaw,
      updatedAt,
      history,
      creationDate,
      customer,
      internalOrderId,
      status,
      affiliateId,
      storeCode,
      storeId,
      sellerCode,
      sellerId,
      value,
      totals,
    } = payload;
    let paymentDate: Date;
    let deliveryDate: Date;

    const historyApproved = history.find(
      ({ status }) => status === 'approved-in-origin',
    );
    if (historyApproved) {
      paymentDate = historyApproved.date;
    }

    const historyDelivered = history.find(
      ({ status }) => status === 'delivered',
    );
    if (historyDelivered) {
      deliveryDate = historyDelivered.date;
    }

    const logisticInfo = Array.isArray(logisticInfoRaw)
      ? logisticInfoRaw.map(l => ({
          ...l,
          price: this.parseFloat(l.price),
          listPrice: this.parseFloat(l.listPrice),
          sellingPrice: this.parseFloat(l.sellingPrice),
        }))
      : [];

    const arrayOfBillingData = Array.isArray(packageAttachment.packages)
      ? packageAttachment.packages.map(p => ({
          ...p,
          invoiceValue: this.parseFloat(p.invoiceValue),
          items: Array.isArray(p.items)
            ? p.items.map(
                ({ _id, ...i }: Partial<{ _id: string; price: any }>) => ({
                  ...i,
                  price: this.parseFloat(i.price),
                }),
              )
            : [],
        }))
      : [];

    const statusCode = {
      micro: status,
      macro: status === 'invoiced' ? 'order-created' : 'order-dispatched',
    };

    return arrayOfBillingData.map(billingData => ({
      orderId,
      storeCode,
      storeId: new Types.ObjectId(storeId),
      sellerCode,
      sellerId: new Types.ObjectId(sellerId),
      internalOrderId: `${internalOrderId}`,
      receiverName: deliveryAddress.receiverName, // @deprecated
      receiverEmail: customer.email, // @deprecated
      receiverPhones: customer.phones, // @deprecated
      salesChannel: affiliateId,
      deliveryCity: deliveryAddress.city, // @deprecated
      deliveryState: deliveryAddress.state, // @deprecated
      deliveryZipCode: deliveryAddress.postalCode, // @deprecated
      orderSale: externalOrderId,
      order: erpInfo.externalOrderId,
      partnerOrder: erpInfo.externalOrderId,
      billingData: arrayOfBillingData, // @deprecated
      logisticInfo,
      status,
      statusCode,
      totalShippingPrice: logisticInfo.length
        ? logisticInfo.reduce((t, { sellingPrice }) => t + sellingPrice, 0)
        : 0,
      orderUpdatedAt: updatedAt,
      deliveryDate,
      orderCreatedAt: creationDate,
      paymentDate,
      invoiceKeys: arrayOfBillingData.map(({ invoiceKey }) => invoiceKey),
      totals: totals.map(total => ({
        id: total.id,
        name: total.name,
        value: this.parseFloat(total.value),
      })),
      value: this.parseFloat(value),
      invoice: {
        serie: billingData.invoiceSerialNumber,
        value: this.parseFloat(billingData.invoiceValue),
        number: billingData.invoiceNumber,
        key: billingData.invoiceKey,
        issuanceDate: billingData.issuanceDate,
        carrierName: billingData.carrierName,
        trackingNumber: billingData.trackingNumber,
        trackingUrl: billingData.trackingUrl,
        items: billingData.items,
        customerDocument: billingData.customerDocument,
      },
      delivery: {
        receiverName: deliveryAddress.receiverName,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        zipCode: deliveryAddress.postalCode,
        country: deliveryAddress.country,
      },
      customer: {
        phones: customer.phones,
        email: customer.email,
        isCorporate: customer.isCorporate,
        firstName: customer.firstName,
        lastName: customer.lastName,
        document: customer.document,
        documentType: customer.documentType,
        corporateName: customer.corporateName,
        fullName:
          customer.fullName || `${customer.firstName} ${customer.lastName}`,
      },
    }));
  }

  static parseFloat(value: any): number {
    if (!value) {
      return 0;
    }
    return Number.parseFloat(
      value && value.$numberDecimal ? value.$numberDecimal : value,
    );
  }

  static mapMessageToOrderAnalysis(
    payload: Partial<OrderDocument>,
    account: any,
  ): any {
    const orderMapper: OrderAnalysis = {};

    orderMapper.id = payload.id;
    orderMapper.orderSale = payload.orderSale;
    orderMapper.orderUpdatedAt = payload.orderUpdatedAt;
    orderMapper.orderCreatedAt = payload.orderCreatedAt;

    orderMapper.statusCode = {
      micro: payload.statusCode.micro,
      macro: payload.statusCode.macro,
    };

    orderMapper.invoice = {
      value: payload.invoice.value,
    };

    orderMapper.carrier = {
      name: payload.invoice.carrierName,
      document: payload.invoice?.carrierDocument,
    };

    orderMapper.deliveryDate = payload.deliveryDate;
    orderMapper.accountName = account?.name || '';
    orderMapper.accountId = account?.id || '';

    orderMapper.customer = {
      firstName: payload.customer.firstName,
      lastName: payload.customer.lastName,
      document: payload.customer.document,
      documentType: payload.customer.documentType,
    };

    orderMapper.shippingEstimateDate =
      payload.estimateDeliveryDateDeliveryCompany;
    orderMapper.trackingUrl = payload.invoice.trackingUrl;

    return orderMapper;
  }
}
