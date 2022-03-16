import { MongooseModule } from '@nestjs/mongoose';
import { Module, Scope } from '@nestjs/common';
import { Env } from 'src/commons/environment/env';
import { NestjsLogger } from 'src/commons/providers/log/nestjs-logger';
import { InfraLogger as Logger } from '@infralabs/infra-logger';
import { AccountService } from './account.service';
import { AccountEntity, AccountSchema } from './schemas/account.schema';
import { AccountController } from './account.controller';
import { ConsumerAccountController } from './consumer/account.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AccountEntity.name,
        schema: AccountSchema,
      },
    ]),
  ],
  controllers: [AccountController, ConsumerAccountController],
  providers: [
    {
      provide: 'LogProvider',
      useClass: Env.NODE_ENV === 'local' ? NestjsLogger : Logger,
      scope: Scope.TRANSIENT,
    },
    AccountService,
  ],
  exports: [
    MongooseModule.forFeature([
      {
        name: AccountEntity.name,
        schema: AccountSchema,
      },
    ]),
  ],
})
export class AccountModule {}
