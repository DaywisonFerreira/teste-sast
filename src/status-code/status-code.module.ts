import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { StatusCodeService } from './status-code.service';
import { StatusCodeController } from './status-code.controller';
import {
  StatusCodeEntity,
  StatusCodeSchema,
} from './schemas/status-code.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: StatusCodeEntity.name,
        schema: StatusCodeSchema,
      },
    ]),
  ],
  controllers: [StatusCodeController],
  providers: [StatusCodeService],
  exports: [
    MongooseModule.forFeature([
      {
        name: StatusCodeEntity.name,
        schema: StatusCodeSchema,
      },
    ]),
  ],
})
export class StatusCodeModule {}
