import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoDocumento } from '../entities';
import { TiposDocumentoService } from './tipos-documento.service';
import { TiposDocumentoController } from './tipos-documento.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TipoDocumento])],
  providers: [TiposDocumentoService],
  controllers: [TiposDocumentoController],
  exports: [TiposDocumentoService],
})
export class TiposDocumentoModule {}
