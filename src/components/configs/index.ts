import { Component } from 'ihub-framework-ts';

import routes from './routes/route';

export default new Component({
    server: {
        routes,
    },
});
