import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactoPF } from './entities/contacto-pf.entity';
import { ContactoPJ } from './entities/contacto-pj.entity';
import { Operacion } from '../operaciones/entities/operacion.entity';
import { ContactosService } from './contactos.service';
import { ContactosController } from './contactos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ContactoPF, ContactoPJ, Operacion])],
  providers: [ContactosService],
  controllers: [ContactosController],
  exports: [ContactosService],
})
export class ContactosModule {}
