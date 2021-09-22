import { IhubFramework } from 'ihub-framework-ts';
import { Server } from 'socket.io';
import { onConnection, middlewareSocket } from './socket';

(async () => {
    const server = await new IhubFramework().start();
    const options = {
        cors:
        {
            origin: [
                new RegExp(/\.ifcshop\.com\.br$/, 'i'),
                new RegExp(/\.azurewebsites\.net$/, 'i'),
                new RegExp(/\.github\.io$/, 'i')
            ],
            credentials: true,
        }
    }
    const io: Server = require('socket.io')(server.server, options)
    console.log(`WebSocket Listen on port ${process.env.SERVER_HTTP_PORT}`)
    io.use(middlewareSocket);
    io.on("connection", onConnection(io))
})();
