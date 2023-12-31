import { Inject, Injectable } from '@nestjs/common';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as ClientFtp from 'ftp';
import * as ClientFtpSSH from 'ssh2-sftp-client';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { Env } from 'src/commons/environment/env';
import { LogProvider } from 'src/commons/providers/log/log-provider.interface';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CarrierService } from '../carrier/carrier.service';
import { InvoiceDocument, InvoiceEntity } from './schemas/invoice.schema';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly carrierService: CarrierService,
    @InjectModel(InvoiceEntity.name)
    private InvoiceModel: Model<InvoiceDocument>,
    @Inject('LogProvider')
    private readonly logger: LogProvider,
  ) {
    this.logger.instanceLogger(InvoiceService.name);
  }

  async sendFtp(data: CreateInvoiceDto, accountId: string) {
    const carrier = await this.carrierService.findByDocument(
      data.carrier.document,
    );
    if (
      !carrier ||
      !carrier.generateNotfisFile ||
      !carrier.integration ||
      !carrier.integration.endpoint ||
      !carrier.integration.attributes
    ) {
      return false;
    }

    const { integration } = carrier;
    let destPath = integration.attributes.find(({ key }) => key === 'destPath');
    const accountIdPath = integration.attributes.find(
      ({ key }) => key === accountId,
    );
    if (accountIdPath) {
      destPath = accountIdPath;
    }
    const secure = integration.attributes.find(({ key }) => key === 'secure');
    const port = integration.attributes.find(({ key }) => key === 'port');
    const password = integration.attributes.find(
      ({ key }) => key === 'password',
    );
    const user = integration.attributes.find(({ key }) => key === 'user');

    const nameFile = await this.downloadFileLocal(
      data.notfisFile,
      data.notfisFileName,
    );
    const filePathLocal = path.join(__dirname, '../tmp', nameFile);
    const file = fs.readFileSync(filePathLocal, 'utf8');

    if (destPath && port && password && user) {
      const destPathFtpServer = `${destPath.value}/${nameFile}`;
      if (integration.type === 'SFTP') {
        await this.sendFileToFtpServerSSH(destPathFtpServer, filePathLocal, {
          host: integration.endpoint,
          user: user.value,
          password: password.value,
          port: port.value,
        });
      } else if (integration.type === 'FTP' && secure) {
        await this.sendFileToFtpServer(file, destPathFtpServer, filePathLocal, {
          host: integration.endpoint,
          user: user.value,
          password: password.value,
          port: port.value,
          secure: secure.value,
        });
      }
      return true;
    }

    return false;
  }

  private async sendFileToFtpServer(
    file: string | Buffer,
    destPathFtp: string,
    filePathLocal: string,
    ftpAccess: any,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const ftp = new ClientFtp();
      ftp.on('ready', () => {
        ftp.put(file, destPathFtp, () => {
          this.logger.log(
            {
              key: 'ifc.freight.api.invoice-service.sendFileToFtpServer',
              message: `File successfully uploaded to FTP server!`,
            },
            {},
          );
          this.deleteFileLocal(filePathLocal);
          resolve(ftp.end());
        });
      });
      ftp.on('error', err => {
        this.deleteFileLocal(filePathLocal);
        reject(err);
      });
      ftp.connect({
        host: ftpAccess.host,
        user: ftpAccess.user,
        password: ftpAccess.password,
        port: ftpAccess.port,
        secure: ftpAccess.secure,
      });
    });
  }

  private async sendFileToFtpServerSSH(
    destPath: string,
    filePathLocal: string,
    ftpAccess: any,
  ) {
    return new Promise((resolve, reject) => {
      const sftp = new ClientFtpSSH();
      sftp
        .connect({
          host: ftpAccess.host,
          username: ftpAccess.user,
          password: ftpAccess.password,
          port: ftpAccess.port,
        })
        .then(() => {
          return sftp.put(fs.createReadStream(filePathLocal), destPath);
        })
        .then(() => {
          this.deleteFileLocal(filePathLocal);
          this.logger.log(
            {
              key: 'ifc.freight.api.invoice-service.sendFileToFtpServerSSH',
              message: `File successfully uploaded to SSH FTP server!`,
            },
            {},
          );
          resolve(sftp.end());
        })
        .catch(err => {
          this.deleteFileLocal(filePathLocal);
          this.logger.error(err.message);
          reject(err);
        });
    });
  }

  private deleteFileLocal(path: string) {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
    this.logger.log(
      {
        key: 'ifc.freight.api.invoice-service.deleteFileLocal',
        message: `File deleted from ${path}`,
      },
      {},
    );
  }

  private async downloadFileLocal(
    url: string,
    nameFile: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (url.includes('.txt')) {
        https.get(url, async response => {
          if (response.statusCode >= 400) {
            reject(
              new Error(
                `Request to ${url} failed with HTTP ${response.statusCode}`,
              ),
            );
          } else {
            const pathFolder = path.join(__dirname, '../tmp');

            if (!fs.existsSync(pathFolder)) {
              fs.mkdirSync(pathFolder);
            }
            const file = fs.createWriteStream(
              path.join(pathFolder, nameFile),
              'utf8',
            );
            response.pipe(file).on('finish', () => {
              this.logger.log(
                {
                  key: 'ifc.freight.api.invoice-service.downloadFileLocal',
                  message: 'Successfully downloading the file',
                },
                {},
              );
              resolve(nameFile);
            });
          }
        });
      } else {
        reject(new Error('Invalid file download URL'));
      }
    });
  }

  public async updateStatus(
    key: string,
    externalOrderId: string,
    status: string,
    errorLog: string = null,
  ): Promise<void> {
    await this.InvoiceModel.updateOne(
      { key, 'order.externalOrderId': externalOrderId },
      { $set: { status, errorLog } },
    );
  }

  public findById(id: string, accountId: string) {
    return this.InvoiceModel.findOne(
      { id, accountId },
      { key: 1, order: 1 },
      { lean: true },
    );
  }

  public async findByOrderNumber(orderNumber: string, accountId: string) {
    return this.InvoiceModel.findOne(
      { 'order.internalOrderId': orderNumber, accountId },
      { key: 1, order: 1 },
      { lean: true },
    );
  }

  async findByStatus(status: string[]): Promise<LeanDocument<InvoiceEntity[]>> {
    return this.InvoiceModel.find({
      status: { $in: status },
    })
      .sort({ updatedAt: 1 })
      .limit(Env.LIMIT_QUERY_ORDERS)
      .lean();
  }

  async findByStatusAndOrderFilter(
    status: string[],
    { key, externalOrderId },
  ): Promise<LeanDocument<InvoiceEntity[]>> {
    return this.InvoiceModel.find({
      status: { $in: status },
      key,
      'order.externalOrderId': externalOrderId,
    })
      .sort({ updatedAt: 1 })
      .limit(Env.LIMIT_QUERY_ORDERS)
      .lean();
  }
}
