import { Injectable } from '@nestjs/common';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as ClientFtp from 'ftp';
import * as ClientFtpSSH from 'ssh2-sftp-client';
import { LogProvider } from '@infralabs/infra-logger';
import { v4 as uuidV4 } from 'uuid';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CarrierService } from '../carrier/carrier.service';

@Injectable()
export class InvoiceService {
  constructor(private readonly carrierService: CarrierService) {}

  async sendFtp(data: CreateInvoiceDto, logger: LogProvider) {
    const carrier = await this.carrierService.findByDocument(
      data.carrier.document,
    );
    if (
      !data.notfisFile ||
      !carrier ||
      !carrier.generateNotfisFile ||
      !carrier.integration ||
      !carrier.integration.endpoint ||
      !carrier.integration.attributes
    ) {
      return false;
    }

    const { integration } = carrier;
    const destPath = integration.attributes.find(
      ({ key }) => key === 'destPath',
    );
    const secure = integration.attributes.find(({ key }) => key === 'secure');
    const port = integration.attributes.find(({ key }) => key === 'port');
    const password = integration.attributes.find(
      ({ key }) => key === 'password',
    );
    const user = integration.attributes.find(({ key }) => key === 'user');

    const nameFile = await this.downloadFileLocal(data.notfisFile, logger);
    const filePathLocal = path
      .join(__dirname, '../tmp', nameFile)
      .replace('dist', 'src');
    const file = fs.readFileSync(filePathLocal, 'utf8');

    if (destPath && port && password && user) {
      const destPathFtpServer = `${destPath.value}/${nameFile}`;
      if (integration.type === 'SFTP') {
        await this.sendFileToFtpServerSSH(
          destPathFtpServer,
          filePathLocal,
          {
            host: integration.endpoint,
            user: user.value,
            password: password.value,
            port: port.value,
          },
          logger,
        );
      } else if (integration.type === 'FTP' && secure) {
        await this.sendFileToFtpServer(
          file,
          destPathFtpServer,
          filePathLocal,
          {
            host: integration.endpoint,
            user: user.value,
            password: password.value,
            port: port.value,
            secure: secure.value,
          },
          logger,
        );
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
    logger: LogProvider,
  ): Promise<void> {
    return new Promise(resolve => {
      const ftp = new ClientFtp();
      ftp.on('ready', () => {
        ftp.put(file, destPathFtp, () => {
          logger.log('File successfully uploaded to FTP server!');
          this.deleteFileLocal(filePathLocal, logger);
          resolve(ftp.end());
        });
      });
      ftp.on('error', err => {
        this.deleteFileLocal(filePathLocal, logger);
        throw err;
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
    logger: LogProvider,
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
          this.deleteFileLocal(filePathLocal, logger);
          logger.log('File successfully uploaded to SSH FTP server!');
          resolve(sftp.end());
        })
        .catch(err => {
          this.deleteFileLocal(filePathLocal, logger);
          logger.error(err.message);
          reject();
        });
    });
  }

  private deleteFileLocal(path: string, logger: LogProvider) {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
    logger.log(`File deleted from ${path}`);
  }

  private async downloadFileLocal(
    url: string,
    logger: LogProvider,
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
            const pathFolder = path
              .join(__dirname, '../tmp')
              .replace('dist', 'src');

            if (!fs.existsSync(pathFolder)) {
              fs.mkdirSync(pathFolder);
            }
            const nameFile = `${uuidV4()}.txt`;
            const file = fs.createWriteStream(
              path.join(pathFolder, nameFile),
              'utf8',
            );
            response.pipe(file).on('finish', () => {
              logger.log('Successfully downloading the file');
              resolve(nameFile);
            });
          }
        });
      } else {
        throw new Error('Invalid file download URL');
      }
    });
  }
}
