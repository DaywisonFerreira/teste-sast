import { InfraLogger } from '@infralabs/infra-logger';

export const infraLoggerMock: InfraLogger | any = {
  log: jest.fn().mockResolvedValue(undefined),
  info: jest.fn().mockResolvedValue(undefined),
  error: jest.fn().mockResolvedValue(undefined),
  warn: jest.fn().mockResolvedValue(undefined),
  debug: jest.fn().mockResolvedValue(undefined),
  verbose: jest.fn().mockResolvedValue(undefined),
  alert: jest.fn().mockResolvedValue(undefined),
};
