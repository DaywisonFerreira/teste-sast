import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { OrderEntity } from 'src/order/schemas/order.schema';
import { StoreController } from '../store.controller';
import { StoreService } from '../store.service';

describe('StoresController', () => {
  let controller: StoreController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [StoreController],
      providers: [
        {
          provide: getModelToken(OrderEntity.name),
          useValue: {},
        },
        { provide: StoreService, useValue: {} },
        { provide: 'LogProvider', useValue: {} },
      ],
    }).compile();

    controller = module.get<StoreController>(StoreController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
