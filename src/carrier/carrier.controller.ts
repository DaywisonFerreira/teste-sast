import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Headers,
  UploadedFile,
  UseInterceptors,
  Inject,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { existsSync, unlinkSync } from 'fs';
import { FastifyFileInterceptor } from 'src/commons/interceptors/file.interceptor';
import { diskStorage } from 'multer';
import { Env } from 'src/commons/environment/env';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { LogProvider } from 'src/commons/providers/log/log-provider.interface';
import { GetCarrierDto } from './dto/get-carrier.dto';
import { UpdateCarrierDto } from './dto/update-carrier.dto';
import { CarrierService } from './carrier.service';
import { EditFileName, FileFilter } from './mappers';
import { UploadLogoDto } from './dto/upload-logo.dto';

@Controller('carrier')
@ApiTags('Carrier')
@ApiBearerAuth()
export class CarrierController {
  constructor(
    private readonly carrierService: CarrierService,
    @Inject('LogProvider')
    private readonly logger: LogProvider,
  ) {
    this.logger.instanceLogger(CarrierController.name);
  }

  @Get(':id')
  @ApiOkResponse({ type: GetCarrierDto })
  async findOne(@Param('id') id: string): Promise<GetCarrierDto> {
    this.logger.log(
      {
        key: 'ifc.freight.api.order.carrier-controller.findOne',
        message: `Find carrier ${id}`,
      },
      {},
    );
    const carrier = await this.carrierService.findOne(id);
    return GetCarrierDto.factory(carrier) as GetCarrierDto;
  }

  @Patch(':id')
  @ApiOkResponse({ type: GetCarrierDto })
  async updateCredentials(
    @Param('id') id: string,
    @Body() updateShippingDto: UpdateCarrierDto,
  ): Promise<GetCarrierDto> {
    this.logger.log(
      {
        key: 'ifc.freight.api.order.carrier-controller.updateCredentials',
        message: `Update carrier ${id}`,
      },
      {},
    );
    try {
      const {
        generateNotfisFile,
        integration,
        partners,
        externalDeliveryMethodId,
      } = updateShippingDto;

      const carrier = await this.carrierService.update(id, {
        generateNotfisFile,
        integration,
        partners,
        externalDeliveryMethodId,
      });
      this.logger.log(
        {
          key: 'ifc.freight.api.order.carrier-controller.updateCredentials',
          message: `Carrier id: ${carrier.id} updated`,
        },
        {},
      );

      return GetCarrierDto.factory(carrier) as GetCarrierDto;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  private async uploadFile(
    fileLocally: any,
    localFileName: string,
    headers: any,
  ): Promise<string> {
    this.logger.log(
      {
        key: 'ifc.freight.api.order.carrier-controller.uploadFile.start',
        message: `Starting file upload (${localFileName})`,
      },
      headers,
    );
    try {
      const credentials = new StorageSharedKeyCredential(
        Env.AZURE_ACCOUNT_NAME,
        Env.AZURE_ACCOUNT_KEY,
      );
      const blobServiceClient = new BlobServiceClient(
        Env.AZURE_BS_STORAGE_URL,
        credentials,
      );
      const containerClient = blobServiceClient.getContainerClient(
        Env.AZURE_BS_CONTAINER_NAME,
      );
      const blockBlobClient = containerClient.getBlockBlobClient(localFileName);
      await blockBlobClient.uploadFile(
        `${fileLocally.destination}/${localFileName}`,
      );

      this.logger.log(
        {
          key: 'ifc.freight.api.order.carrier-controller.uploadFile.finish',
          message: `Starting file upload (${localFileName})`,
        },
        headers,
      );

      return `${String(Env.AZURE_BS_STORAGE_URL)}/${String(
        Env.AZURE_BS_CONTAINER_NAME,
      )}/${localFileName}`;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  @Patch(':id/logo')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FastifyFileInterceptor('file', {
      storage: diskStorage({
        destination:
          Env.NODE_ENV !== 'local'
            ? `${process.cwd()}/dist/tmp`
            : `${process.cwd()}/src/tmp`,
        filename: EditFileName,
      }),
      limits: { fileSize: 10000000 },
      fileFilter: FileFilter,
    }),
  )
  async uploadCarrierLogo(
    @UploadedFile() file: any,
    @Param('id') id: string,
    @Body() _: UploadLogoDto,
    @Headers() headers: any,
  ) {
    this.logger.log(
      {
        key: 'ifc.freight.api.order.carrier-controller.uploadCarrierLogo',
        message: `File logo to update on carrierId: ${id}`,
      },
      headers,
    );
    try {
      const logo = await this.uploadFile(file, file.filename, headers);
      await this.carrierService.updateLogo(id, {
        logo,
      });
    } catch (error) {
      this.logger.log(error);
      throw error;
    } finally {
      if (existsSync(file.path)) {
        unlinkSync(file.path);
      }
    }
  }
}
