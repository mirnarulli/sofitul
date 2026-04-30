import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feriado } from './feriado.entity';
import { FeriadosService } from './feriados.service';
import { FeriadosController } from './feriados.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Feriado])],
  controllers: [FeriadosController],
  providers: [FeriadosService],
  exports: [FeriadosService],   // exportado para que OperacionesModule lo use
})
export class FeriadosModule {}
