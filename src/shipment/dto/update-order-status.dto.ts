import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  ArrayNotEmpty,
} from 'class-validator';

export class StatusCode {
  @ApiProperty({ example: 'in-transit', required: true, type: String })
  @IsString()
  @IsNotEmpty()
  macro: string;

  @ApiProperty({ example: 'carrier-possession', required: true, type: String })
  @IsString()
  @IsNotEmpty()
  micro: string;

  @ApiProperty({
    example: 'PROCESSAMENTO NA FILIAL',
    required: true,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class OrderData {
  @IsString()
  @IsNotEmpty()
  @MinLength(44)
  @MaxLength(44)
  @ApiProperty({
    example: '35230159546515001610550010027905721010021258',
    required: true,
    type: String,
  })
  invoiceKey: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '220048180', required: true, type: String })
  orderNumber: string;

  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => StatusCode)
  @ApiProperty({ type: StatusCode, required: true })
  statusCode: StatusCode;

  @ApiPropertyOptional({
    description:
      'Quando o pedido for extraviado esse campo deve ser preenchido informando o motivo',
    example: 'PERDA',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ example: 'Esse status foi atualizado porque...' })
  @IsString()
  @IsOptional()
  additionalInfo?: string;
}

export class UpdateOrderStatusDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @ApiProperty({ type: [OrderData] })
  @Type(() => OrderData)
  data: OrderData[];
}

export class HeadersUpdateOrderStatusDTO {
  @ApiProperty({
    description: 'Tenant Id',
    type: String,
    required: true,
  })
  'x-tenant-id': string;

  @ApiPropertyOptional({
    description: 'Correlation Id',
    type: String,
  })
  'x-correlation-id': string;
}
