import { Request, Response, models, tasks } from 'ihub-framework-ts';
import { LogService } from '@infralabs/infra-logger';
import { OrderRepository } from '../repositories/orderRepository';
const { USERNAME, PASSWORD, DELIVERED, DELIVERY_FAILURE } = process.env;
import IWebHookIntelepost from '../interfaces/WebHookIntelipost';

/**
 * WebHook function from Intelipost
 * POST /courier
 */
export = async (req: Request, res: Response) => {
    const logger = new LogService();
    const orderRepository = new OrderRepository();
    try {
        logger.startAt();
        const payload: IWebHookIntelepost = req.body;
        const token = req.headers.authorization.split(' ')[1];
        const credentials = Buffer.from(`${USERNAME}:${PASSWORD}`).toString(
            'base64'
        );
        if (credentials !== token) {
            logger.error(new Error('Username or password invalid'));
            logger.endAt();
            await logger.sendLog();
            return res
                .status(401)
                .json({ message: 'Username or Password invalid' });
        }
        const orders = {
            order: payload.order_number,
            dispatchDate: payload.history.created_iso,
            estimateDeliveryDateDeliveryCompany:
                payload.estimated_delivery_date.logistic_provider.current_iso,
            partnerMessage: payload.history.provider_message,
            numberVolumes: payload.volume_number,
            microStatus: payload.history.shipment_volume_micro_state.name,
            lastOccurrenceMacro: payload.history.esprinter_message,
            lastOccurrenceMicro:
                payload.history.shipment_volume_micro_state.default_name,
            lastOccurrenceMessage:
                payload.history.shipment_volume_micro_state.description,
            partnerStatus: payload.history.shipment_order_volume_state_localized,
            partnerUpdatedAt: payload.history.event_date_iso
        };
        await orderRepository.findOneAndUpdate(
            { order: payload.order_number },
            orders
        );
        tasks.send(
            'order',
            'orderStoreCode',
            JSON.stringify({
                responseExchange: 'tracking',
                responseRouteKey: 'ackOrderStoreCode',
                data: {
                    externalOrderId: payload.order_number,
                    invoiceNumber: payload.invoice.invoice_number,
                },
            })
        );
        return res.json('Created');
    } catch (e) {
        logger.error(e);
        logger.endAt();
        await logger.sendLog();
        return res.status(500).json({
            status: 500,
            code: 'tracking.get.order.error',
            error: e.message,
        });
    }
};
