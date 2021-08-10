import { RequestPrivate, Response, Route } from 'ihub-framework-ts';
// import keycloakMiddleware from '../middlewares/keycloakMiddleware';

import postIntelipost from '../controllers/postIntelipost';
import getOrders from '../controllers/getOrders';
import exportOrders from '../controllers/exportOrders';

export default [
    {
        method: 'get',
        path: '/health',
        private: false,
        controller: async (req: RequestPrivate, res: Response): Promise<void> => {
            res.json({ message: 'OK' });
        },
    },
    {
        method: 'post',
        path: '/courier/intelipost',
        private: false,
        controller: postIntelipost,
    },
    {
        method: 'get',
        path: '/',
        // middlewares: keycloakMiddleware,
        controller: getOrders,
    },
    {
        method: 'post',
        path: '/orders/export',
        // middlewares: keyCloakMiddleware,
        controller: exportOrders,
    }
] as Route[];
