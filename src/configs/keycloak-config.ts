import session from 'express-session';
import Keycloak from 'keycloak-connect';

let _keycloak: Keycloak.Keycloak;

const keycloakConfig: Keycloak.KeycloakConfig = {
    'bearer-only': true,
    'auth-server-url': process.env.AUTH_SERVER_URL,
    realm: process.env.REALM,
    resource: process.env.RESOURCE,
    'confidential-port': process.env.CONFIDENTIAL_PORT,
    'ssl-required': 'false',
};

export function initKeycloak() {
    if (_keycloak) {
        console.warn('Trying to init Keycloak again!');
        return _keycloak;
    } else {
        console.log('Initializing Keycloak...');
        const memoryStore = new session.MemoryStore();
        _keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);

        return _keycloak;
    }
}

export function getKeycloak() {
    if (!_keycloak) {
        console.error(
            'Keycloak has not been initialized. Please called init first.'
        );
    }
    return _keycloak;
}
