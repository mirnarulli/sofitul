import { IsOptional, IsDateString, IsString } from 'class-validator';

/** Solo metadatos editables de un documento ya cargado.
 *  Para reemplazar el archivo usar el endpoint POST /:id/upload. */
export class UpdateDocumentoContactoDto {
  @IsOptional()
  @IsDateString()
  fechaDocumento?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
