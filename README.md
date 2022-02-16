## ifc.logistiic.api.core - Comunicação filas "fanout"

Detalhamento de comunicação com filas do tipo "fanout":

- [Pacote NPM utilizado para comunicação com RabbitMq](https://www.npmjs.com/package/@golevelup/nestjs-rabbitmq)
  - Após a intalação do pacote, criar o móduloo de conexão importando o módulo "@RabbitMQModule", da pacote instalado.
  - Configurar o módulo passando os atributos:
    - exchanges;
    - uri;
    - connectionInitOptions(opcional);
  - Na camada de Service importar o decorator "@RabbitSubscribe", passando como configuração os atributos:
    - exchange;
    - routingKey;
    - queue;
  - Atribuir este decorator na função que irá lidar com a mensagem recebida.

### Exemplo de implementação
```
// message.module.ts
@Module({
  imports: [
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: 'notificationTag',
          type: 'fanout',
        },
        ...
      ],
      uri: 'amqp://localhost:5672',
      connectionInitOptions: { wait: false } // opcional,
    }),
  ],
  providers: [MessageService],
  controllers: [],
})
export class MessageModule {}
____________________________________________________________________

// message.service.ts
@Injectable()
export class MessageService {
  constructor() {}

  @RabbitSubscribe({
    exchange: 'notificationTag',
    routingKey: '',
    queue: 'queue',
  })
  public async notificationHandler(notification: INotification) {
    console.log(`Notification ${notification} was received`);
    try {
      // Do something ...
    } catch (error) {
      console.error(error.message, { payload: JSON.stringify(notification) });
    }
  }
}

```

## ifc.logistiic.api.core - Uso Keycloak

Fazendo login no keycloak:

- https://ifc-stock.postman.co/workspace/Team-Workspace~f8b1e6a8-3403-430c-8543-0f6aa98fbdb0/request/16045662-a0e2c5de-2112-4d36-9d5c-7cf83fb8ac0f

- usar `access_token` como token JWT para chamar a API.
