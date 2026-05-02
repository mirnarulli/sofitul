import { PartialType } from '@nestjs/mapped-types';
import { CreateScoringClienteDto } from './create-scoring-cliente.dto';

export class UpdateScoringClienteDto extends PartialType(CreateScoringClienteDto) {}
