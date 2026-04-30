import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuentaTransferencia } from './cuenta-transferencia.entity';
import { CuentasTransferenciaService } from './cuentas-transferencia.service';
import { CuentasTransferenciaController } from './cuentas-transferencia.controller';

@Module({
  imports:     [TypeOrmModule.forFeature([CuentaTransferencia])],
  providers:   [CuentasTransferenciaService],
  controllers: [CuentasTransferenciaController],
  exports:     [CuentasTransferenciaService],
})
export class CuentasTransferenciaModule {}
