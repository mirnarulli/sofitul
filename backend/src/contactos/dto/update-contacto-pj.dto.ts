import { PartialType } from '@nestjs/mapped-types';
import { CreateContactoPJDto } from './create-contacto-pj.dto';

export class UpdateContactoPJDto extends PartialType(CreateContactoPJDto) {}
