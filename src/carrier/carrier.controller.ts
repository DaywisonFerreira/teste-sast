import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
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
import { LogProvider } from '@infralabs/infra-logger';
import { createBlobService } from 'azure-storage';
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
    @Inject('LogProvider') private logger: LogProvider,
  ) {
    this.logger.context = CarrierController.name;
  }

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
  ): Promise<GetCarrierDto> {
    const { generateNotfisFile, integration, externalDeliveryMethodId } =
      updateShippingDto;

    const carrier = await this.carrierService.update(id, {
      generateNotfisFile,
      integration,
      externalDeliveryMethodId,
    });
    return GetCarrierDto.factory(carrier) as GetCarrierDto;
  }

  private async uploadFile(
    fileLocally: any,
    localFileName: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const blobSvc = createBlobService(String(Env.AZURE_BS_ACCESS_KEY));
      blobSvc.createBlockBlobFromLocalFile(
        String(Env.AZURE_BS_CONTAINER_NAME),
        localFileName,
        fileLocally.path,
        error => {
          if (error) {
            reject(error);
          }
          resolve(
            `${String(Env.AZURE_BS_STORAGE_URL)}/${String(
              process.env.AZURE_BS_CONTAINER_NAME,
            )}/${localFileName}`,
          );
        },
      );
    });
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
  ) {
    const localFileName = `${file.filename}_${file.originalname}`;
    try {
      const logo = await this.uploadFile(file, localFileName);
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
