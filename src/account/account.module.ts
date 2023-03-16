import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InfraLogger } from 'src/commons/providers/log/infra-logger';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { ConsumerAccountController } from './consumer/account.controller';
import { AccountEntity, AccountSchema } from './schemas/account.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AccountEntity.name, schema: AccountSchema },
    ]),
  ],
  controllers: [AccountController, ConsumerAccountController],
  providers: [
    AccountService,
    {
      provide: 'LogProvider',
      useClass: InfraLogger,
    },
  ],
  exports: [
    MongooseModule.forFeature([
      { name: AccountEntity.name, schema: AccountSchema },
    ]),
  ],
})
export class AccountModule {}
