import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

/** Campos que el cliente envía al crear un documento (multipart/form-data).
 *  La URL del archivo la agrega el servidor tras procesar el upload — no debe
 *  venir del cliente. */
export class CreateDocumentoContactoDto {
  @IsString()
  @IsIn(['pf', 'pj'])
  contactoTipo: string;

  @IsString()
  contactoId: string;

  @IsOptional()
  @IsString()
  tipoId?: string;

  @IsString()
  tipoNombre: string;

  @IsOptional()
  @IsString()
  tipoCodigo?: string;

  @IsOptional()
  @IsString()
  @IsIn(['documentos', 'due_diligence'])
  tipoCategoria?: string;

  @IsOptional()
  @IsDateString()
  fechaDocumento?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
