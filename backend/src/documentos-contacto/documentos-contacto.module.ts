import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoDocumentoAdjunto } from '../entities';
import { DocumentoContacto } from './documento-contacto.entity';
import { DocumentosContactoService }    from './documentos-contacto.service';
import { DocumentosContactoController } from './documentos-contacto.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TipoDocumentoAdjunto, DocumentoContacto])],
  providers: [DocumentosContactoService],
  controllers: [DocumentosContactoController],
  exports: [DocumentosContactoService],
})
export class DocumentosContactoModule {}
