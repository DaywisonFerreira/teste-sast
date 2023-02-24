import { Module } from '@nestjs/common';
import { InfraLogger } from 'src/commons/providers/log/infra-logger';
import { OrderModule } from 'src/order/order.module';
import { ShipmentController } from './shipment.controller';

@Module({
  imports: [OrderModule],
  controllers: [ShipmentController],
  providers: [
    {
      provide: 'LogProvider',
      useClass: InfraLogger,
    },
  ],
})
export class ShipmentModule {}
