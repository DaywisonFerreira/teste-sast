/* eslint-disable max-classes-per-file */
import { ApiProperty } from '@nestjs/swagger';
import { File } from 'fastify-multer/lib/interfaces';

export enum MimeTypeEnum {
  ImageApng = 'image/apng',
  ImageAvif = 'image/avif',
  ImageGif = 'image/gif',
  ImageJpeg = 'image/jpeg',
  ImagePng = 'image/png',
  ImageSvg = 'image/svg+xml',
  ImageWebp = 'image/webp',
  VideoMpeg = 'video/mpeg',
  VideoMp4 = 'video/mp4',
  VideoWebm = 'video/webm',
  TextPlain = 'text/plain',
  TextHtml = 'text/html',
  TextCss = 'text/css',
  ApplicationCss = 'application/css',
  TextJavascript = 'text/javascript',
  ApplicationJavacript = 'application/javascript',
}
export class UploadLogoDto {
  @ApiProperty({
    type: 'file',
    description: 'File containing logo of carrier',
    example: 'logo.jpeg',
  })
  file: File;
}
