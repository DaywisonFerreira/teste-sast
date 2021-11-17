import { Server, Socket } from 'socket.io';

import { JWTUtils } from '../utils/JwtUtils';
import { Notification, UsersLogged } from '../common/interfaces/socket';
import { NotificationService } from '../components/root/services/notificationService';
import { LogService } from '@infralabs/infra-logger';

const users: UsersLogged[] = [];

let io: Server

const middlewareSocket = (socket: Socket, next: Function) => {
    const token = socket.handshake.auth.token;

    if(!token){
        next(new Error("Missing token"));
    }

    const jwtPayload = JWTUtils.decode(token);

    if(jwtPayload.hasError){
        next(new Error(jwtPayload.error));
    }

    socket.data.userId = jwtPayload.data.sub
    socket.data.email = jwtPayload.data.email
    next()

};

const onConnection = (ioInstance: Server) => async (socket: Socket) => {
    io = ioInstance
    const { data } = socket

    const userAlreadyLogged = users.find(user => user.userId === data.userId);

    if(!userAlreadyLogged){
        users.push({
            email: data.email,
            userId: data.userId
        })

        await socket.join(`${data.userId}`)
    }else{
        await socket.join(`${userAlreadyLogged.userId}`)
    }

    //TODO: REGISTER LISTENERS IF NECESSARY;
};

const notifyUser = async (userId: string, data: Partial<Notification>, logger: LogService) => {
    try {
        const notificationSvc = new NotificationService()

        const notification = await notificationSvc.save({...data, notifiedUsers: [{ user: userId, read: false }] })
        const { _id, notificationType, payload, createdAt } = notification

        const userLogged = users.find(user => user.userId === userId)

        io.in(`${userLogged.userId}`).volatile.emit('notification', {
            _id, notificationType, payload: payload ? JSON.parse(payload) : {}, createdAt, read: false });

        logger.add('ifc.freight.api.orders.notifyUser', `Notification: ${_id} send to ${userId}`);
    } catch (error) {
        logger.error(error);
    }
}

const broadcast = async (data: Partial<Notification>, logger: LogService) => {
    try {
        const notificationSvc = new NotificationService()

        const notification = await notificationSvc.save({...data,
            notifiedUsers: users.map(user => {
                return { user: user.userId, read: false }
            })
        })

        const { _id, notificationType, payload, createdAt } = notification

        io.emit("notification", { _id, notificationType, payload: payload ? JSON.parse(payload) : {}, createdAt, read: false })

        logger.add('ifc.freight.api.orders.broadcast', `Notification: ${_id} send to Broadcast`);
    } catch (error) {
        logger.error(error);
    }
}

export { onConnection, middlewareSocket, notifyUser, broadcast }
