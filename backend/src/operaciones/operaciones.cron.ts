import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OperacionesService } from './operaciones.service';

/**
 * Tareas programadas del módulo de operaciones.
 *
 * - procesarVencidas: corre todos los días a las 07:00 (PY, UTC-4)
 *   = 11:00 UTC. Mueve a MORA las operaciones cuya fecha_vencimiento
 *   ya pasó y siguen en estado activo (EN_COBRANZA, DESEMBOLSADO, etc.).
 */
@Injectable()
export class OperacionesCron {
  private readonly logger = new Logger(OperacionesCron.name);

  constructor(private svc: OperacionesService) {}

  /** Diario a las 11:00 UTC (07:00 Paraguay UTC-4) */
  @Cron('0 11 * * *')
  async procesarVencidas() {
    this.logger.log('▶ Cron procesarVencidas — inicio');
    try {
      const resultado = await this.svc.procesarVencidas();
      if (resultado.procesadas > 0) {
        this.logger.warn(
          `✔ ${resultado.procesadas} operación(es) pasadas a MORA: ${resultado.ids.join(', ')}`,
        );
      } else {
        this.logger.log('✔ Sin operaciones vencidas hoy.');
      }
    } catch (err) {
      this.logger.error('✖ Error en cron procesarVencidas', err instanceof Error ? err.stack : String(err));
    }
  }
}
