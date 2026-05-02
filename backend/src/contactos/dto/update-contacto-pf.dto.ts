import { PartialType } from '@nestjs/mapped-types';
import { CreateContactoPFDto } from './create-contacto-pf.dto';

export class UpdateContactoPFDto extends PartialType(CreateContactoPFDto) {}
