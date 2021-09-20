import http from "http";

import { Server, Socket } from "socket.io"

import { IhubFramework } from 'ihub-framework-ts';
import { UsersLogged, Notification } from './common/interfaces/socket';
import { NotificationService } from './components/root/services/notificationService';

(async () => {
    await new IhubFramework().start();
})();

const serverHttp = http.createServer();
serverHttp.listen(parseInt(process.env.SERVER_SOCKET_PORT), () => console.log(`WebSocket Listen on port ${process.env.SERVER_SOCKET_PORT}`))

const io: Server = new Server(serverHttp, { cors: { origin: "*", credentials: false } })

const users: UsersLogged[] = []

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

const notifyUser = async (userId: string, data: Partial<Notification>) => {
    const notificationSvc = new NotificationService()
    const userLogged = users.find(user => user.userId === userId)

    if(!userLogged) return;

    io.to(userLogged.socketId).emit("notification", {...data, createdAt: new Date().toISOString(), read: false })

    await notificationSvc.save({...data, notifiedUsers: [{ user: userId, read: false }] })
}

const broadcast = async (data: Partial<Notification>) => {
    const notificationSvc = new NotificationService()

    io.emit("notification", {...data, createdAt: new Date().toISOString(), read: false })

    await notificationSvc.save({...data,
        notifiedUsers: users.map(user => {
            return { user: user.userId, read: false }
        })
    })
}

export { notifyUser, broadcast }
