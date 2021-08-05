import { Component } from "ihub-framework-ts";

import routes from './routes/route';
import messages from './messages/message';

export default new Component({
    server: {
        routes,
    },
    messages,
});