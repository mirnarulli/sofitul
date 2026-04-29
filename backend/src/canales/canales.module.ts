import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Canal } from '../entities';
import { CanalesService } from './canales.service';
import { CanalesController } from './canales.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Canal])],
  providers: [CanalesService],
  controllers: [CanalesController],
  exports: [CanalesService],
})
export class CanalesModule {}
