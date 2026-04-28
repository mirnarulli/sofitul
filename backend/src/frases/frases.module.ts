import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Frase } from '../entities';
import { FrasesService } from './frases.service';
import { FrasesController } from './frases.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Frase])],
  providers: [FrasesService],
  controllers: [FrasesController],
  exports: [FrasesService],
})
export class FrasesModule {}
