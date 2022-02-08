import { RequestPrivate, Response, Route } from 'ihub-framework-ts';

import postIntelipost from '../../root/controllers/postIntelipost';
import getOrders from '../../root/controllers/getOrders';
import getDeliveryCompanies from '../../root/controllers/getDeliveryCompanies';
import exportOrders from '../../root/controllers/exportOrders';
import updateNotification from '../controllers/updateNotification';
import getNotifications from '../controllers/getNotifications';

import middlewares from '../../../utils/middlewares';

// import keyCloakMiddleware from '../../../utils/middlewares/keycloakMiddleware';
import jwtMiddleware from '../../../utils/middlewares/jwtMiddleware';

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
        path: '/intelipost',
        private: false,
        controller: postIntelipost,
    },
    {
        method: 'get',
        path: '/',
        middlewares,
        controller: getOrders,
    },
    {
        method: 'get',
        path: '/delivery-companies',
        middlewares,
        controller: getDeliveryCompanies,
    },
    {
        method: 'get',
        path: '/export',
        middlewares,
        controller: exportOrders,
    },
    {
        method: 'put',
        path: '/notification',
        // middlewares: [...keyCloakMiddleware, jwtMiddleware],
        middlewares: [jwtMiddleware],
        controller: updateNotification,
    },
    {
        method: 'get',
        path: '/notification',
        // middlewares: [...keyCloakMiddleware, jwtMiddleware],
        middlewares: [jwtMiddleware],
        controller: getNotifications,
    }
] as Route[];
