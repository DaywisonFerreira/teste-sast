import http from "http";
import { Server, Socket } from "socket.io"

import { IhubFramework } from 'ihub-framework-ts';
import { UsersRooms, Notification } from './common/interfaces/socket';

(async () => {
    await new IhubFramework().start();
})();

const serverHttp = http.createServer();
serverHttp.listen(parseInt(process.env.WS_PORT), () => console.log("WebSocket Listen on port 8081"))

const io: Server = new Server(serverHttp, { cors: { origin: "*", credentials: false } })

const users: UsersRooms[] = []

io.on("connection", (socket: Socket) => {
    socket.on("connect_user", (data) => {

        if(!data.sub) return;

        const userAlreadyLogged = users.find(user => user.userId === data.sub);

        if(!userAlreadyLogged){
            users.push({
                socketId: socket.id,
                email: data.email,
                userId: data.sub,
                userName: data.userName,
            })
        }else{
            users.splice(users.findIndex(user => user.userId === userAlreadyLogged.userId), 1)
            users.push({ ...userAlreadyLogged, socketId: socket.id })
        }
    })
})

//TODO: PERSISTIR NOTIFICAÇÕES NO BANCO

const notifyUser = (userId: string, data: Notification) => {
    const userLogged = users.find(user => user.userId === userId)

    if(!userLogged) return

    io.to(userLogged.socketId).emit("notification", {...data, dateTime: new Date()})
}

const broadcast = (data: Notification) => {
    io.emit("notification", {...data, dateTime: new Date()})
}

export { notifyUser, broadcast }
