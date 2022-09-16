import { Test } from '@nestjs/testing';
import { CarrierService } from '../carrier.service';
import { ConsumerCarrierController } from '../consumer/carrier.controller';

describe('Carrier Consumer Controller', () => {
  let controller: ConsumerCarrierController;
  let service: CarrierService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ConsumerCarrierController],
      providers: [
        { provide: CarrierService, useValue: {} },
        { provide: 'KafkaService', useValue: {} },
      ],
    }).compile();

    controller = await module.resolve<ConsumerCarrierController>(
      ConsumerCarrierController,
    );
    service = await module.resolve<CarrierService>(CarrierService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('Consumer carrier created', () => {
    it('Should create a carrier', async () => {
      const spyKafkaProducerCommitOffsets = jest
        .spyOn(controller as any, 'removeFromQueue')
        .mockImplementationOnce(() => null);

      expect(
        await controller.createCarrier({
          value: '{"data":{}}',
          partition: 1,
          headers: {},
          offset: 1,
          key: '',
          timestamp: '',
        }),
      ).toBeUndefined();

      expect(spyKafkaProducerCommitOffsets).toBeCalledTimes(1);
    });

    it('Should update a carrier', async () => {
      const spyKafkaProducerCommitOffsets = jest
        .spyOn(controller as any, 'removeFromQueue')
        .mockImplementationOnce(() => null);

      expect(
        await controller.updateCarrier({
          value: '{"data":{}}',
          partition: 1,
          headers: {},
          offset: 1,
          key: '',
          timestamp: '',
        }),
      ).toBeUndefined();

      expect(spyKafkaProducerCommitOffsets).toBeCalledTimes(1);
    });
  });
});
