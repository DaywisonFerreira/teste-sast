import { ApiProperty } from '@nestjs/swagger';

export class UpdateGenerateNotfisFile {
  @ApiProperty({
    description: 'Controls invoice generation',
    type: Boolean,
    example: true,
    required: false,
  })
  generateNotfisFile: boolean;

  @ApiProperty({
    description: 'Controls invoice integrate intelipost ftp server',
    type: Boolean,
    example: true,
    required: false,
  })
  integrateIntelipost: boolean;
}
