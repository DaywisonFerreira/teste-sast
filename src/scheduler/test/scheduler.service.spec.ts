/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs/promises';
import { InfraLogger } from 'src/commons/providers/log/infra-logger';
import { NestjsEventEmitter } from '../../commons/providers/event/nestjs-event-emitter';
import { SchedulerService } from '../scheduler.service';

describe('Scheduler Service Tests', () => {
  let service: SchedulerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        {
          provide: NestjsEventEmitter,
          useValue: {
            emit: () => null,
          },
        },
        {
          provide: 'LogProvider',
          useClass: InfraLogger,
        },
      ],
    }).compile();

    service = await module.resolve(SchedulerService);
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('clearTmpFolder', () => {
    it('Should remove older files from TMP folder', async () => {
      const olderDate = new Date();
      olderDate.setDate(new Date().getDate() - 12);

      const spyFsReaddir = jest
        .spyOn(fs, 'readdir')
        // @ts-ignore
        .mockResolvedValueOnce(['file_one', 'file_two']);

      const spyFsStat = jest
        .spyOn(fs, 'stat')
        // @ts-ignore
        .mockResolvedValue({ birthtime: olderDate });

      const spyFsUnlink = jest
        .spyOn(fs, 'unlink')
        // @ts-ignore
        .mockResolvedValueOnce(undefined);

      await service.clearTmpFolder();

      expect(spyFsReaddir).toBeCalledTimes(1);
      expect(spyFsStat).toBeCalledTimes(2);
      expect(spyFsUnlink).toBeCalledTimes(2);
    });

    it('Should ignore newest files from TMP folder', async () => {
      const newestDate = new Date();
      newestDate.setDate(new Date().getDate() + 12);

      const spyFsReaddir = jest
        .spyOn(fs, 'readdir')
        // @ts-ignore
        .mockResolvedValueOnce(['file_one', 'file_two']);

      const spyFsStat = jest
        .spyOn(fs, 'stat')
        // @ts-ignore
        .mockResolvedValue({ birthtime: newestDate });

      const spyFsUnlink = jest
        .spyOn(fs, 'unlink')
        // @ts-ignore
        .mockResolvedValueOnce(undefined);

      await service.clearTmpFolder();

      expect(spyFsReaddir).toBeCalledTimes(1);
      expect(spyFsStat).toBeCalledTimes(2);
      expect(spyFsUnlink).not.toBeCalled();
    });

    it('Should ignore if not exist files on folder TMP', async () => {
      const spyFsReaddir = jest
        .spyOn(fs, 'readdir')
        // @ts-ignore
        .mockResolvedValueOnce([]);

      const spyFsStat = jest.spyOn(fs, 'stat');

      const spyFsUnlink = jest.spyOn(fs, 'unlink');

      await service.clearTmpFolder();

      expect(spyFsReaddir).toBeCalledTimes(1);
      expect(spyFsStat).not.toBeCalled();
      expect(spyFsUnlink).not.toBeCalled();
    });
  });
});
