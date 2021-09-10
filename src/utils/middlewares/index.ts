import keycloakMiddleware from './keycloakMiddleware';
import jwtMiddleware from './jwtMiddleware';
import storesMiddleware from './storesMiddleware';
import configMiddleware from './configMiddleware';

export = [jwtMiddleware, storesMiddleware, configMiddleware];
