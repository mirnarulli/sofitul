import { Module } from '@nestjs/common';
import { TypeOrmModule }        from '@nestjs/typeorm';
import { ContactoPF }           from '../contactos/entities/contacto-pf.entity';
import { ValidataConsulta }     from './entities/validata-consulta.entity';
import { ValidataController }   from './validata.controller';
import { ValidataService }      from './validata.service';
import { ConfiguracionModule }  from '../configuracion/configuracion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContactoPF, ValidataConsulta]),
    ConfiguracionModule,
  ],
  controllers: [ValidataController],
  providers:   [ValidataService],
  exports:     [ValidataService],
})
export class ValidataModule {}
