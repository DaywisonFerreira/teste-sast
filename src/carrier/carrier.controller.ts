import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  Headers,
  UploadedFile,
  UseInterceptors,
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
import { InfraLogger } from '@infralabs/infra-logger';
import { GetCarrierDto } from './dto/get-carrier.dto';
import { UpdateCarrierDto } from './dto/update-carrier.dto';
import { CarrierService } from './carrier.service';
import { EditFileName, FileFilter } from './mappers';
import { UploadLogoDto } from './dto/upload-logo.dto';

@Controller('carrier')
@ApiTags('Carrier')
@ApiBearerAuth()
export class CarrierController {
  constructor(private readonly carrierService: CarrierService) {}

  @Get(':id')
  @ApiOkResponse({ type: GetCarrierDto })
  async findOne(@Param('id') id: string): Promise<GetCarrierDto> {
    const carrier = await this.carrierService.findOne(id);
    return GetCarrierDto.factory(carrier) as GetCarrierDto;
  }

  @Patch(':id')
  @ApiOkResponse({ type: GetCarrierDto })
  async updateCredentials(
    @Param('id') id: string,
    @Body() updateShippingDto: UpdateCarrierDto,
    @Req() req: any,
  ): Promise<GetCarrierDto> {
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
      req.logger.verbose(`Carrier id: ${carrier.id} updated`);
      return GetCarrierDto.factory(carrier) as GetCarrierDto;
    } catch (error) {
      req.logger.error(error);
      throw error;
    }
  }

  private async uploadFile(
    fileLocally: any,
    localFileName: string,
    headers: any,
  ): Promise<string> {
    const logger = new InfraLogger(headers, CarrierController.name);
    try {
      logger.log(`Starting file upload (${localFileName})`);
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

      logger.log(`Finish file upload (${localFileName})`);
      return `${String(Env.AZURE_BS_STORAGE_URL)}/${String(
        Env.AZURE_BS_CONTAINER_NAME,
      )}/${localFileName}`;
    } catch (error) {
      logger.error(error);
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
    @Req() req: any,
    @Headers() headers: any,
  ) {
    try {
      const logo = await this.uploadFile(file, file.filename, headers);
      await this.carrierService.updateLogo(id, {
        logo,
      });
      req.logger.verbose(`File logo updated to carrierId: ${id}`);
    } catch (error) {
      req.logger.log(error);
      throw error;
    } finally {
      if (existsSync(file.path)) {
        unlinkSync(file.path);
      }
    }
  }
}
