import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { createReadStream, existsSync, unlinkSync } from 'fs';
import { FastifyFileInterceptor } from 'src/commons/interceptors/file.interceptor';
import { diskStorage } from 'multer';
import { Env } from 'src/commons/environment/env';
import axios from 'axios';
import * as FormData from 'form-data';
import { LogProvider } from '@infralabs/infra-logger';
import { JWTGuard } from '../commons/guards/jwt.guard';
import { GetCarrierDto } from './dto/get-carrier.dto';
import { UpdateCarrierDto } from './dto/update-carrier.dto';
import { CarrierService } from './carrier.service';
import { EditFileName, FileFilter } from './mappers';
import { UploadLogoDto } from './dto/upload-logo.dto';
import { HeadersDto } from './dto/headers.dto';

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

  @Patch(':id/logo')
  @UseGuards(JWTGuard)
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
    @Headers() headers: HeadersDto,
    @Param('id') id: string,
    @Body() _: UploadLogoDto,
  ) {
    const fileLocally = file;
    try {
      const data = new FormData();
      data.append('file', createReadStream(file.path), {
        contentType: file.mimetype,
      });
      data.append('canonical', 'carriers-logo');
      data.append('context', 'freight');
      data.append('contentType', file.mimetype);
      data.append('contentLanguage', 'en-us');
      data.append('cacheControl', 'no-cache');

      const config: any = {
        url: Env.CONTENT_API_URI,
        method: 'POST',
        headers: {
          'X-Tenant-Id': headers['x-tenant-id'],
          'X-Channel-Id': headers['x-channel-id'],
          Authorization: headers.authorization,
          ...data.getHeaders(),
        },
        data,
      };

      const response: any = await axios(config);

      await this.carrierService.updateLogo(id, {
        logo: response.data.data.uri,
      });
    } catch (error) {
      this.logger.log(error);
      throw error;
    } finally {
      if (existsSync(fileLocally.path)) {
        unlinkSync(fileLocally.path);
      }
    }
  }
}
