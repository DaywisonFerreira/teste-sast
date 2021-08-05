import { Route } from 'ihub-framework-ts';
import keycloakMiddleware from '../middlewares/keycloakMiddleware';

import postIntelipost from '../controllers/postIntelipost';
import getOrders from '../controllers/getOrders';

const routes: Array<Route> = [];

routes.push({
    method: 'post',
    path: '/courier/intelipost',
    private: false,
    controller: postIntelipost,
});

routes.push({
    method: 'get',
    path: '/trackings/orders',
    middlewares: keycloakMiddleware,
    controller: getOrders,
});

export = routes;
