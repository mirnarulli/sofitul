import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TalonarioInterno } from './entities/talonario-interno.entity';
import { TimbradoSet } from './entities/timbrado-set.entity';
import { TalonerosService } from './talonarios.service';
import { TalonerosController } from './talonarios.controller';

@Module({
  imports:     [TypeOrmModule.forFeature([TalonarioInterno, TimbradoSet])],
  providers:   [TalonerosService],
  controllers: [TalonerosController],
  exports:     [TalonerosService],
})
export class TalonerosModule {}
