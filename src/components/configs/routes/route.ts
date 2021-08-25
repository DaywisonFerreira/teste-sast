import { Route } from 'ihub-framework-ts';
import configMiddleware from '../../../utils/middlewares/configMiddleware';
import keyCloakMiddleware from '../../../utils/middlewares/keycloakMiddleware';

import getStores from '../controllers/getStores';

export default [
    {
        method: 'get',
        path: '/stores',
        controller: getStores,
        middlewares: [...keyCloakMiddleware, configMiddleware],
    },
] as Route[];
