import { Server, Socket } from 'socket.io';

import { JWTUtils } from '../utils/JwtUtils';
import { Notification, UsersLogged } from '../common/interfaces/socket';
import { NotificationService } from '../components/root/services/notificationService';
import { LogService } from '@infralabs/infra-logger';

const users: UsersLogged[] = [];

let io: Server

const middlewareSocket = (socket: Socket, next: Function) => {
    // const token = socket.handshake.auth.token;
    const token  = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJVSnl2S2NoMXJ1QnRWNE9zWS1yT0U1NEtFeU1YY19BV3JickM1dmZhUjF3In0.eyJleHAiOjE2MzM1NDUyNjAsImlhdCI6MTYzMzU0MzQ2MCwianRpIjoiNWI2YWY2NDMtMzExMi00YjliLThjYWEtMmM4OTVkODRmNDlkIiwiaXNzIjoiaHR0cHM6Ly9pZmNhdXRoLWhtbC5henVyZXdlYnNpdGVzLm5ldC9hdXRoL3JlYWxtcy9pbmZyYWlkIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6ImNmMjVjZmZjLTJiMWYtNDk1NC1hNGM1LTJkZGQ5NWE0NTA4MyIsInR5cCI6IkJlYXJlciIsImF6cCI6ImN4YWFzLWRlbGl2ZXJ5aHViIiwic2Vzc2lvbl9zdGF0ZSI6IjcyOTNiZWM1LTQ3ODMtNDljMS1iOGRjLTViMTRkYzgyMDkwNiIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cHM6Ly9hcGlobWwuaWZjc2hvcC5jb20uYnIiLCJodHRwOi8vbG9jYWxob3N0OjgwMDMiLCJodHRwczovL2lmYy1kZWxpdmVyeWh1Yi1kZXYuYXp1cmV3ZWJzaXRlcy5uZXQiLCJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJodHRwczovL2FwaWRldi5pZmNzaG9wLmNvbS5iciJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiVXNlckd1ZXN0Iiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoicHJvZmlsZSB2aWV3IGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJzdG9yZXMiOlsiNjA1MzU1ZGFhZmRlOGMwMDNhZTZmNzFhIiwiNWQ4MjIxMDY4NTAxNDIwMDEwOGZmOThmIl0sIm5hbWUiOiJUZXN0ZSBUZXN0ZSIsInByZWZlcnJlZF91c2VybmFtZSI6InRlc3RlLWN4YWFzIiwiZ2l2ZW5fbmFtZSI6IlRlc3RlIiwiZmFtaWx5X25hbWUiOiJUZXN0ZSIsImVtYWlsIjoicGVkcm8ucGVyZWlyYS5leHRAaW5mcmFjb21lcmNlLmNvbS5iciJ9.h3QOSYPnU0jspmfGaNWguNOTLnfPElz7M-n5_QvoGskOZgNbZGl3zUn8yr38kuzy3EkK36rfjJaAMyESetXNfBSiQfQKE7LDwBeRJL5vLXvbNAHW7nA_po9LIoWS3Y9OoSUkrGOE-EbOLt3HL14PTOGvFhbnBArWA-ZrblBh_f183AfGQucy8TJaQp3MbZR-Mrn5qWqoc7dqOOlPBVCuDKoE69Bp0xy1bzIIpSeyD7e8aIA2KJqGVNvD6vjObFsc_mgsAuQ8-fNKHuRYOw_MkmDjyQ7G02_N6FfzOOn9TyLwNtp4BdCZ9F7XI9IUUPwVgk3X0i36J2zeITCCPryA5Q"

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
