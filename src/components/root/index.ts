import { Component } from "ihub-framework-ts";

import routes from './routes/route';
import messages from './messages';

export default new Component({
    server: {
        routes,
    },
    messages
});
