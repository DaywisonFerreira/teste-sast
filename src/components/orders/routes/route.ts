import { Route } from 'ihub-framework-ts';

import postIntelipost from '../controllers/postIntelipost';
import getOrders from '../controllers/getOrders';
import getDeliveryCompanies from '../controllers/getDeliveryCompanies';
import exportOrders from '../controllers/exportOrders';

import middlewares from '../../../utils/middlewares';

export default [
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
    }
] as Route[];
