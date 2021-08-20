import { RouteMiddleware } from 'ihub-framework-ts';

import { initKeycloak } from '../../configs/keycloak-config';
const keycloak = initKeycloak();
const keyCloakMiddleware: Array<RouteMiddleware | any> = [];

keyCloakMiddleware.push(keycloak.middleware());
keyCloakMiddleware.push(keycloak.protect());

export = keyCloakMiddleware;
