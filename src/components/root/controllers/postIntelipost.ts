import { Request, Response, tasks } from 'ihub-framework-ts';
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
        logger.add('ifc.logistic.api.orders.postIntelipost', {
            message: 'Intelipost payload received',
            payload: JSON.stringify(payload)
        });
        logger.endAt();
        await logger.sendLog();
        if (credentials !== token) {
            logger.error(new Error('Username or password invalid'));
            logger.endAt();
            await logger.sendLog();
            return res
                .status(401)
                .json({ message: 'Username or Password invalid' });
        }
        const order = {
            order: payload.order_number,
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
            partnerUpdatedAt: payload.history.event_date_iso
        };
        await orderRepository.merge(
            { order: payload.order_number },
            order
        );
        const state = payload.history.shipment_order_volume_state;
        const invoiceNumber = payload.invoice.invoice_number;
        const orderId = payload.order_number;
        if (state === 'DELIVERY_FAILED' || state === 'DELIVERED') {
            tasks.send('order', state === 'DELIVERED' ? DELIVERED : DELIVERY_FAILURE, JSON.stringify({
                internalOrderId: orderId.split('-')[1],
                occurrenceDate: '',
                controlPointId: state === 'DELIVERED' ? DELIVERED : DELIVERY_FAILURE,
                invoiceNumber
            }));
        }
        logger.add('ifc.logistic.api.orders.postIntelipost', {
            message: `Message sent to exchange order and routeKey: ${state === 'DELIVERED' ? DELIVERED : DELIVERY_FAILURE}`,
            payload: JSON.stringify({
                internalOrderId: orderId.split('-')[1],
                occurrenceDate: '',
                controlPointId: state === 'DELIVERED' ? DELIVERED : DELIVERY_FAILURE,
                invoiceNumber
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
