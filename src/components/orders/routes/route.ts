import { RequestPrivate, Response, Route } from 'ihub-framework-ts';

import postIntelipost from '../controllers/postIntelipost';
import getOrders from '../controllers/getOrders';
import exportOrders from '../controllers/exportOrders';
import keyCloakMiddleware from '../../../utils/middlewares/keycloakMiddleware';

export default [
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
        method: 'get',
        path: '/export',
        middlewares: keyCloakMiddleware,
        controller: exportOrders,
    }
] as Route[];
