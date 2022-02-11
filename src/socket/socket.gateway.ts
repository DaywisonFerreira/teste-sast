import { Inject } from '@nestjs/common';
import { LogProvider } from '@infralabs/infra-logger';
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

import { Env } from '../commons/environment/env';
import { JWT } from '../commons/utils/jwt.utils';
import { SocketService } from './socket.service';

@WebSocketGateway({ cors: true })
export class SocketGateway implements OnGatewayInit, OnGatewayConnection {
  constructor(
    private readonly jwt: JWT,
    private socketService: SocketService,
    @Inject('LogProvider') private logger: LogProvider,
  ) {
    this.logger.context = SocketGateway.name;
  }

  private port = Env.APPLICATION_PORT;

  afterInit(server: Server) {
    this.socketService.server = server;
    this.logger.log(`Socket Listen on port ${this.port}`);
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      this.logger.log(`Socket connected ${client.id}`);
      const { token } = client.handshake.auth;

      if (!token) {
        throw new WsException('Missing token');
      }

      const jwtPayload = this.jwt.decode(token);

      if (jwtPayload.hasError) {
        throw new WsException(jwtPayload.error);
      }

      const { sub } = jwtPayload.data;

      await client.join(sub);
    } catch (error) {
      client.emit('error', {
        error: 'Invalid credentials',
        message: error.message,
      });
      client.disconnect(true);
      this.logger.error(error.message);
    }
  }

  // @SubscribeMessage('event-listener')
  // handleMessage(client: any, payload: any): string {
  //   return 'Hello world!';
  // }
}
