import { Route } from 'ihub-framework-ts';

import jwtMiddleware from '../../../utils/middlewares/jwtMiddleware';
// import keyCloakMiddleware from '../../../utils/middlewares/keycloakMiddleware';

import getStores from '../controllers/getStores';

export default [
    {
        method: 'get',
        path: '/stores',
        // middlewares: [...keyCloakMiddleware, jwtMiddleware],
        middlewares: [jwtMiddleware],
        controller: getStores,
    },
] as Route[];
