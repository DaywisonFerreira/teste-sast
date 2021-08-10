import { RouteMiddleware } from 'ihub-framework-ts';

import { initKeycloak } from '../../configs/keycloak-config';
const keycloak = initKeycloak();
const keyCloakMiddleware: Array<RouteMiddleware | any> = [];

/**
 * Middleware to verify if is auth with keycloak
 */
keyCloakMiddleware.push(keycloak.middleware());

export = keyCloakMiddleware;
