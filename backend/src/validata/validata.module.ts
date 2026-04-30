import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactoPF }       from '../contactos/entities/contacto-pf.entity';
import { ValidataConsulta } from './entities/validata-consulta.entity';
import { ValidataController } from './validata.controller';
import { ValidataService }    from './validata.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContactoPF, ValidataConsulta])],
  controllers: [ValidataController],
  providers:   [ValidataService],
  exports:     [ValidataService],
})
export class ValidataModule {}
