import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountService } from './account.service';
import { AccountEntity, AccountSchema } from './schemas/account.schema';
import { AccountController } from './account.controller';
import { ConsumerAccountController } from './consumer/account.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AccountEntity.name, schema: AccountSchema },
    ]),
  ],
  controllers: [AccountController, ConsumerAccountController],
  providers: [AccountService],
  exports: [
    MongooseModule.forFeature([
      { name: AccountEntity.name, schema: AccountSchema },
    ]),
  ],
})
export class AccountModule {}
