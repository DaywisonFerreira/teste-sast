import keycloakMiddleware from './keycloakMiddleware';
import jwtMiddleware from './jwtMiddleware';
import storesMiddleware from './storesMiddleware';
import configMiddleware from './configMiddleware';

export = [...keycloakMiddleware, jwtMiddleware, storesMiddleware, configMiddleware];
