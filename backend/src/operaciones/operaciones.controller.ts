import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req,
         UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

// ── Helper: multer config reutilizable ────────────────────────────────────────
function uploadsConfig(subfolder: string, prefix: string) {
  return {
    storage: diskStorage({
      destination: (_req: Express.Request, _file: Express.Multer.File, cb: (e: null, d: string) => void) => {
        const dir = join(process.cwd(), 'uploads', subfolder);
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filename: (req: any, file: Express.Multer.File, cb: (e: null, f: string) => void) => {
        const id     = (req.params?.id as string | undefined) ?? 'new';
        const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${prefix}-${id}-${suffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
      const allowedExt = ['.pdf', '.jpg', '.jpeg', '.png'];
      const allowedMime = ['application/pdf', 'image/jpeg', 'image/png'];
      const extOk  = allowedExt.includes(extname(file.originalname).toLowerCase());
      const mimeOk = allowedMime.includes(file.mimetype);
      if (extOk && mimeOk) return cb(null, true);
      cb(new BadRequestException('Solo se aceptan PDF, JPG o PNG'), false);
    },
    limits: { fileSize: 10 * 1024 * 1024 },
  };
}
import { OperacionesService } from './operaciones.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CambiarEstadoDto }          from './dto/cambiar-estado.dto';
import { CalcularInteresDto }         from './dto/calcular-interes.dto';
import { ActualizarContratoDto }      from './dto/actualizar-contrato.dto';
import { CreateOperacionDto }         from './dto/create-operacion.dto';
import { UpdateOperacionDto }         from './dto/update-operacion.dto';
import { RegistrarProrrogaDto }       from './dto/registrar-prorroga.dto';
import { UpdateChequeDto }            from './dto/update-cheque.dto';
import { RegistrarPagoCuotaDto }      from './dto/registrar-pago-cuota.dto';
import { CreateEstadoOperacionDto }   from './dto/create-estado-operacion.dto';
import { UpdateEstadoOperacionDto }   from './dto/update-estado-operacion.dto';

@Controller('operaciones')
@UseGuards(JwtAuthGuard)
export class OperacionesController {
  constructor(private svc: OperacionesService) {}

  @Get()
  findAll(
    @Query('estado')     estado?: string,
    @Query('tipo')       tipo?: string,
    @Query('contactoId') contactoId?: string,
    @Query('page')       page?: string,
    @Query('limit')      limit?: string,
  ) {
    return this.svc.findAll({
      estado:     estado     || undefined,
      tipo:       tipo       || undefined,
      contactoId: contactoId || undefined,
      page:  page  ? +page  : 1,
      limit: limit ? +limit : 50,
    });
  }

  // Rutas fijas ANTES de :id para evitar conflictos
  @Get('estados')
  findEstados() { return this.svc.findEstados(); }

  @Post('estados')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  createEstado(@Body() b: CreateEstadoOperacionDto) { return this.svc.createEstado(b); }

  @Get('estados-siguientes/:codigo')
  getSiguientes(@Param('codigo') codigo: string) { return this.svc.getSiguientesEstados(codigo); }

  @Get('transiciones')
  getTransiciones() { return this.svc.getTransicionesMatriz(); }

  @Put('transiciones')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  saveMatriz(@Body() b: { transiciones: { desdeId: string; hastaId: string }[] }) {
    return this.svc.saveMatriz(b.transiciones ?? []);
  }

  @Post('calcular-interes')
  calcularInteres(@Body() b: CalcularInteresDto) {
    return { interes: OperacionesService.calcularInteres(b.monto, b.tasaMensual, b.dias) };
  }

  // CRUD principal
  @Get(':id')
  findById(@Param('id') id: string) { return this.svc.findById(id); }

  @Post()
  create(@Body() b: CreateOperacionDto) { return this.svc.create(b, b.cheques, b.cuotas); }

  @Put(':id')
  update(@Param('id') id: string, @Body() b: UpdateOperacionDto) { return this.svc.update(id, b); }

  @Put(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body() b: CambiarEstadoDto, @Req() req: { user?: { email?: string } }) {
    return this.svc.cambiarEstado(id, b.estado, b.nota, req.user?.email);
  }

  @Put(':id/prorroga')
  registrarProrroga(@Param('id') id: string, @Body() b: RegistrarProrrogaDto) {
    return this.svc.registrarProrroga(id, b);
  }

  // Sub-recursos (segmentos distintos — sin conflicto con :id)
  @Put('cheques/:id')
  updateCheque(@Param('id') id: string, @Body() b: UpdateChequeDto) { return this.svc.updateCheque(id, b); }

  @Put('cuotas/:id/pagar')
  pagarCuota(@Param('id') id: string, @Body() b: RegistrarPagoCuotaDto) { return this.svc.registrarPagoCuota(id, b); }

  @Put('estados/:id')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  updateEstado(@Param('id') id: string, @Body() b: UpdateEstadoOperacionDto) { return this.svc.updateEstado(id, b); }

  // ── Contrato TeDescuento ──────────────────────────────────────────────────
  @Put(':id/contrato')
  actualizarContrato(@Param('id') id: string, @Body() b: ActualizarContratoDto) {
    return this.svc.actualizarContrato(id, b);
  }

  @Post(':id/contrato/upload')
  @UseInterceptors(FileInterceptor('file', uploadsConfig('contratos', 'contrato')))
  async uploadContrato(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió archivo');
    return this.svc.actualizarContrato(id, { contratoTeDescuentoUrl: `/uploads/contratos/${file.filename}` });
  }

  // ── Fichas de análisis (Descuento de Cheque) ──────────────────────────────
  @Post(':id/ficha-informconf/upload')
  @UseInterceptors(FileInterceptor('file', uploadsConfig('fichas', 'informconf')))
  async uploadInformconf(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió archivo');
    return this.svc.actualizarContrato(id, { fichaInformconfUrl: `/uploads/fichas/${file.filename}` });
  }

  @Post(':id/ficha-infocheck/upload')
  @UseInterceptors(FileInterceptor('file', uploadsConfig('fichas', 'infocheck')))
  async uploadInfocheck(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió archivo');
    return this.svc.actualizarContrato(id, { fichaInfocheckUrl: `/uploads/fichas/${file.filename}` });
  }
}
