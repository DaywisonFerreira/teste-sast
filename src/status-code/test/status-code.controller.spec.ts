import { InfraLogger } from 'src/commons/providers/log/infra-logger';
import { mock, MockProxy } from 'jest-mock-extended';
import { Test } from '@nestjs/testing';
import { StatusCodeService } from '../status-code.service';
import { StatusCodeController } from '../status-code.controller';

describe('StatusCodeController', () => {
  let infraLogger: MockProxy<InfraLogger>;
  let statusCodeService: MockProxy<StatusCodeService>;
  let statusCodeController: StatusCodeController;

  beforeEach(async () => {
    infraLogger = mock();
    statusCodeService = mock();

    const module = await Test.createTestingModule({
      controllers: [StatusCodeController],
      providers: [
        {
          provide: StatusCodeService,
          useValue: statusCodeService,
        },
        {
          provide: 'LogProvider',
          useValue: infraLogger,
        },
      ],
    }).compile();

    statusCodeController =
      module.get<StatusCodeController>(StatusCodeController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStatusCodeMacro', () => {
    it('should return an array of status code macro', async () => {
      const mockResult = [{ code: 'in-transit' }, { code: 'delivered' }];
      const expectedResult = [{ code: 'in-transit' }, { code: 'delivered' }];
      const mockRes = {
        send: jest.fn(),
      };
      statusCodeService.getStatusCodeMacroList.mockResolvedValueOnce(
        mockResult as any,
      );

      await statusCodeController.getStatusCodeMacro(mockRes);
      expect(statusCodeService.getStatusCodeMacroList).toBeCalled();
      expect(mockRes.send).toBeCalledWith(expectedResult);
    });
  });

  describe('getStatusCodeMicro', () => {
    it('should return a micro status code array', async () => {
      const mockCode = 'in-transit';
      const mockResult = [
        {
          code: 'carrier-possesion',
          description: 'Em posse da transportadora',
        },
      ];
      const expectedResult = [
        {
          code: 'carrier-possesion',
          description: 'Em posse da transportadora',
        },
      ];
      const mockRes = {
        send: jest.fn(),
      };
      statusCodeService.getStatusCodeMicroList.mockResolvedValueOnce(
        mockResult as any,
      );

      await statusCodeController.getStatusCodeMicro(mockCode, mockRes);
      expect(statusCodeService.getStatusCodeMicroList).toBeCalledWith(mockCode);
      expect(mockRes.send).toBeCalledWith(expectedResult);
    });
  });
});
