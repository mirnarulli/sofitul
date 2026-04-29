import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InformeRigor } from '../entities';
import { InformesRigorService } from './informes-rigor.service';
import { InformesRigorController } from './informes-rigor.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InformeRigor])],
  providers: [InformesRigorService],
  controllers: [InformesRigorController],
  exports: [InformesRigorService],
})
export class InformesRigorModule {}
