import { Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { CarrierService } from '../../carrier/carrier.service';
import { AccountService } from '../../account/account.service';

@Injectable()
export class ConfigMapper {
  constructor(
    private readonly carrierService: CarrierService,
    private readonly accountService: AccountService,
  ) {}

  async mapInvoiceToIntelipost(data: CreateInvoiceDto) {
    const location = await this.accountService.findOneLocation(data.accountId);
    const carrier = await this.carrierService.findByDocument(
      data.carrier.document,
    );
    const shipmentOrderVolumeArray = data.packages.map((item, index) => {
      return {
        shipment_order_volume_number: 16553603 + index,
        name: 'CAIXA',
        weight: item.netWeight,
        volume_type_code: 'box',
        width: item.width,
        height: item.height,
        length: item.length,
        products_nature: '',
        products_quantity: item.productsQuantity,
        is_icms_exempt: false,
        tracking_code: item.trackingCode,
        shipment_order_volume_invoice: {
          invoice_series: data.serie,
          invoice_number: data.number,
          invoice_key: data.key,
          invoice_date: data.emissionDate,
          invoice_total_value: data.total.value,
          invoice_products_value: data.total.value,
          invoice_cfop: '',
        },
      };
    });

    const dataFormatted = {
      delivery_method_id: carrier.externalDeliveryMethodId,
      customer_shipping_costs: data.total.freightValue,
      shipped_date: '',
      end_customer: {
        first_name: data.receiver.name.split(' ')[0],
        last_name: data.receiver.name.split(' ')[1] ?? '',
        email: data.receiver.email,
        phone: data.receiver.phone,
        cellphone: data.receiver.phone,
        is_company: data.receiver.documentType !== 'CPF',
        federal_tax_payer_id: data.receiver.document,
        shipping_address: data.receiver.address.street,
        shipping_number: data.receiver.address.number,
        shipping_additional: data.receiver.address.complement,
        shipping_quarter: data.receiver.address.neighborhood,
        shipping_city: data.receiver.address.city,
        shipping_state: data.receiver.address.state,
        shipping_zip_code: data.receiver.address.zipCode,
        shipping_country: data.receiver.address.country,
      },
      origin_federal_tax_payer_id: location.document,
      origin_warehouse_code: location.externalWarehouseCode,
      shipment_order_volume_array: shipmentOrderVolumeArray,
      order_number: data.order.internalOrderId,
      estimated_delivery_date: '',
      sales_channel: location.name,
      sales_order_number: data.order.externalOrderId,
      parent_shipment_order_number: '',
      scheduled: false,
      created: '',
      shipment_order_type: 'NORMAL',
    };
    return dataFormatted;
  }
}
