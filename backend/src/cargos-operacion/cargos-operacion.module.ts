import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CargoOperacion } from './entities/cargo-operacion.entity';
import { CargosOperacionService } from './cargos-operacion.service';
import { CargosOperacionController } from './cargos-operacion.controller';

@Module({
  imports:     [TypeOrmModule.forFeature([CargoOperacion])],
  providers:   [CargosOperacionService],
  controllers: [CargosOperacionController],
  exports:     [CargosOperacionService],
})
export class CargosOperacionModule {}
