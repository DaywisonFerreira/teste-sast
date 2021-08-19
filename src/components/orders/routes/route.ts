import { Route } from 'ihub-framework-ts';

import postIntelipost from '../controllers/postIntelipost';
import getOrders from '../controllers/getOrders';
import getDeliveryCompanies from '../controllers/getDeliveryCompanies';
import exportOrders from '../controllers/exportOrders';
import keyCloakMiddleware from '../../../utils/middlewares/keycloakMiddleware';
import configMiddleware from '../../../utils/middlewares/configMiddleware';

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
        middlewares: [...keyCloakMiddleware, configMiddleware],
        controller: getOrders,
    },
    {
        method: 'get',
        path: '/delivery-companies',
        middlewares: [...keyCloakMiddleware, configMiddleware],
        controller: getDeliveryCompanies,
    },
    {
        method: 'get',
        path: '/export',
        middlewares: [...keyCloakMiddleware, configMiddleware],
        controller: exportOrders,
    }
] as Route[];
