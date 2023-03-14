import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Model } from 'mongoose';
import {
  StatusCodeDocument,
  StatusCodeEntity,
} from '../schemas/status-code.schema';
import { StatusCodeService } from '../status-code.service';

describe('StatusCodeService', () => {
  let statusCodeService: StatusCodeService;
  let statusCodeModelMock: Model<StatusCodeDocument>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        StatusCodeService,
        {
          provide: getModelToken(StatusCodeEntity.name),
          useFactory: () => ({
            aggregate: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            sort: jest.fn(),
            lean: jest.fn(),
          }),
        },
        {
          provide: 'LogProvider',
          useValue: {},
        },
      ],
    }).compile();

    statusCodeService = module.get(StatusCodeService);
    statusCodeModelMock = module.get(getModelToken(StatusCodeEntity.name));
  });

  it('should be defined', () => {
    expect(statusCodeService).toBeDefined();
  });

  describe('getStatusCodeMacroList', () => {
    it('should call StatusCodeModel.aggregate() with correct args', async () => {
      const exec = jest
        .fn()
        .mockResolvedValueOnce(() => [{ code: 'in-transit' }]);
      statusCodeModelMock.aggregate = jest
        .fn()
        .mockImplementationOnce(() => ({ exec }));

      await statusCodeService.getStatusCodeMacroList();

      expect(statusCodeModelMock.aggregate).toHaveBeenCalledWith([
        { $sort: { macro: 1 } },
        { $group: { _id: '$macro', data: { $first: '$$ROOT' } } },
        { $project: { _id: 0, code: '$_id' } },
      ]);
    });
  });

  describe('getStatusCodeMicroList', () => {
    it('should call StatusCodeModel.aggregate() with correct args', async () => {
      const exec = jest
        .fn()
        .mockResolvedValueOnce(() => [{ code: 'carrier-possesion' }]);
      statusCodeModelMock.aggregate = jest
        .fn()
        .mockImplementationOnce(() => ({ exec }));
      const macro = 'in-transit';

      await statusCodeService.getStatusCodeMicroList(macro);

      expect(statusCodeModelMock.aggregate).toHaveBeenCalledWith([
        { $match: { macro } },
        {
          $project: {
            _id: 0,
            code: '$micro',
            description: '$description',
          },
        },
      ]);
    });
  });
});
