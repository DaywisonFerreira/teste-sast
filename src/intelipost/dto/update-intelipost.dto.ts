import { PartialType } from '@nestjs/swagger';
import { CreateIntelipost } from './create-intelipost.dto';

export class UpdateIntelipostDto extends PartialType(CreateIntelipost) {}
