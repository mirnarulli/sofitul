import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoCargoDto } from './create-tipo-cargo.dto';

export class UpdateTipoCargoDto extends PartialType(CreateTipoCargoDto) {}
