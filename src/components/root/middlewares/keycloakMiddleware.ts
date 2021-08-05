import { RouteMiddleware, models, plugins } from 'ihub-framework-ts';

import { initKeycloak } from '../../../config/keycloak-config';
const keycloak = initKeycloak();
const keyCloakMiddleware: Array<RouteMiddleware | any> = [];

/**
 * Middleware to verify if is auth with keycloak
 */
keyCloakMiddleware.push(keycloak.middleware());

export = keyCloakMiddleware;
