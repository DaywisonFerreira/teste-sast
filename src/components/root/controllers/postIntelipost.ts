import { Request, Response, tasks } from 'ihub-framework-ts';
import { LogService } from '@infralabs/infra-logger';

import { OrderRepository } from '../repositories/orderRepository';
import IWebHookIntelipost from '../interfaces/WebHookIntelipost';
import { OrderService } from '../services/orderService';

const { INTELIPOST_USERNAME, INTELIPOST_PASSWORD, DELIVERED, DELIVERY_FAILURE } = process.env;


/**
 * WebHook function from Intelipost
 * POST /courier
 */
export = async (req: Request, res: Response) => {
    const logger = new LogService();
    const orderRepository = new OrderRepository();
    try {
        logger.startAt();
        const payload: IWebHookIntelipost = req.body;
        const token = req.headers.authorization.split(' ')[1];
        const credentials = Buffer.from(`${INTELIPOST_USERNAME}:${INTELIPOST_PASSWORD}`).toString(
            'base64'
        );
        logger.add('postIntelipost.received', {
            message: 'Intelipost payload received',
            payload: JSON.stringify(payload)
        });
        logger.endAt();
        await logger.sendLog();

        if (credentials !== token) {
            logger.startAt();
            logger.error(new Error('Username or password invalid'));
            logger.endAt();
            await logger.sendLog();
            return res
                .status(401)
                .json({ message: 'Username or Password invalid' });
        }

        if (!payload.sales_order_number) {
            logger.startAt();
            logger.error(new Error('Missing "sales_order_number"'));
            logger.endAt();
            await logger.sendLog();
            return res
                .status(400)
                .json({ message: 'Missing "sales_order_number"' });
        }

        logger.startAt();
        const order = {
            orderSale: payload.sales_order_number,
            partnerOrder: payload.order_number,
            dispatchDate: payload.history.created_iso,
            estimateDeliveryDateDeliveryCompany:
            payload.estimated_delivery_date.client.current_iso,
            partnerMessage: payload.history.provider_message,
            numberVolumes: payload.volume_number,
            microStatus: payload.history.shipment_volume_micro_state.name,
            lastOccurrenceMacro: payload.history.esprinter_message,
            lastOccurrenceMicro:
            payload.history.shipment_volume_micro_state.default_name,
            lastOccurrenceMessage:
            payload.history.shipment_volume_micro_state.description,
            partnerStatus: payload.history.shipment_order_volume_state_localized,
            partnerUpdatedAt: payload.history.event_date_iso,
            i18n: payload.history.shipment_volume_micro_state.i18n_name,
            
        };

        await orderRepository.merge(
            { orderSale: payload.sales_order_number },
            order
        );
        const state = payload.history.shipment_order_volume_state;
        const invoiceNumber = payload.invoice.invoice_number;
        const internalOrderId = payload.order_number.split('-').length
            ? payload.order_number.split('-')[1]
            : payload.order_number;

        const exchange = 'order';
        const routeKey = 'orderTrackingUpdated';

         const orderMerged = await orderRepository.findOne({ orderSale: payload.sales_order_number })

         const exportingOrder = JSON.stringify({
             storeId: orderMerged.storeId ,
             storeCode:orderMerged.storeCode ,
             externalOrderId: order.orderSale,
             internalOrderId: Number.parseInt(internalOrderId),
             shippingEstimateDate: order.estimateDeliveryDateDeliveryCompany ,
             eventDate: order.partnerUpdatedAt,
             partnerMessage: order.partnerMessage,
             numberVolumes: order.numberVolumes,
             i18nName: order.i18n,
             microStatus: order.microStatus,
             occurrenceMacro: order.lastOccurrenceMacro ,
             occurrenceMicro: order.lastOccurrenceMicro,
             occurrenceMessage:order.lastOccurrenceMessage,
             partnerStatus: order.partnerStatus,
         })
         if (orderMerged.storeId && orderMerged.storeCode) {

            tasks.send(exchange, routeKey, exportingOrder );
            
         } else {
             const orderSalevalue = order.orderSale
            logger.add('ifc.logistic.api.orders.postIntelipost', {
                message: `${orderSalevalue} order not sent due to lack of storeId storeCode `, 
                payload: JSON.stringify({
                    exportingOrder
                })             
            });
         }
         logger.add('postIntelipost.sent', {
             message: `Message sent to exchange ${exchange} and routeKey ${routeKey}`,
             payload: JSON.stringify({
                exportingOrder
             })

        });
        logger.endAt();
        await logger.sendLog();

        return res.json('Created');
    } catch (error) {
        logger.error(error);
        logger.endAt();
        await logger.sendLog();
        return res.status(500).json({
            status: 500,
            code: 'tracking.get.order.error',
            error: error.message
        });
    }
};
