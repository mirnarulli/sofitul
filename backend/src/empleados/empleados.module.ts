import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empleado } from './entities/empleado.entity';
import { EmpleadoDocumento } from './entities/empleado-documento.entity';
import { EmpleadosService } from './empleados.service';
import { EmpleadosController } from './empleados.controller';

@Module({
  imports:     [TypeOrmModule.forFeature([Empleado, EmpleadoDocumento])],
  providers:   [EmpleadosService],
  controllers: [EmpleadosController],
  exports:     [EmpleadosService],
})
export class EmpleadosModule {}
