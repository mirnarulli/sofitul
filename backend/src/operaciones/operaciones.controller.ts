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
      destination: (_req: any, _file: any, cb: any) => {
        const dir = join(process.cwd(), 'uploads', subfolder);
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req: any, file: any, cb: any) => {
        const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${prefix}-${req.params.id}-${suffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (_req: any, file: any, cb: any) => {
      const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
      if (allowed.includes(extname(file.originalname).toLowerCase())) return cb(null, true);
      cb(new BadRequestException('Solo se aceptan PDF, JPG o PNG'), false);
    },
    limits: { fileSize: 10 * 1024 * 1024 },
  };
}
import { OperacionesService } from './operaciones.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('operaciones')
@UseGuards(JwtAuthGuard)
export class OperacionesController {
  constructor(private svc: OperacionesService) {}

  @Get()
  findAll(@Query() q: any) {
    return this.svc.findAll({
      estado:     q.estado     || undefined,
      tipo:       q.tipo       || undefined,
      contactoId: q.contactoId || undefined,
      page:  q.page  ? +q.page  : 1,
      limit: q.limit ? +q.limit : 50,
    });
  }

  // Rutas fijas ANTES de :id para evitar conflictos
  @Get('estados')
  findEstados() { return this.svc.findEstados(); }

  @Post('estados')
  createEstado(@Body() b: any) { return this.svc.createEstado(b); }

  @Post('calcular-interes')
  calcularInteres(@Body() b: { monto: number; tasaMensual: number; dias: number }) {
    return { interes: OperacionesService.calcularInteres(b.monto, b.tasaMensual, b.dias) };
  }

  // CRUD principal
  @Get(':id')
  findById(@Param('id') id: string) { return this.svc.findById(id); }

  @Post()
  create(@Body() b: any) { return this.svc.create(b, b.cheques, b.cuotas); }

  @Put(':id')
  update(@Param('id') id: string, @Body() b: any) { return this.svc.update(id, b); }

  @Put(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body() b: { estado: string; nota?: string }, @Req() req: any) {
    return this.svc.cambiarEstado(id, b.estado, b.nota, req.user?.email);
  }

  @Put(':id/prorroga')
  registrarProrroga(@Param('id') id: string, @Body() b: any) {
    return this.svc.registrarProrroga(id, b);
  }

  // Sub-recursos (segmentos distintos — sin conflicto con :id)
  @Put('cheques/:id')
  updateCheque(@Param('id') id: string, @Body() b: any) { return this.svc.updateCheque(id, b); }

  @Put('cuotas/:id/pagar')
  pagarCuota(@Param('id') id: string, @Body() b: any) { return this.svc.registrarPagoCuota(id, b); }

  @Put('estados/:id')
  updateEstado(@Param('id') id: string, @Body() b: any) { return this.svc.updateEstado(id, b); }

  // ── Contrato TeDescuento ──────────────────────────────────────────────────
  @Put(':id/contrato')
  actualizarContrato(@Param('id') id: string, @Body() b: { nroContratoTeDescuento?: string }) {
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
    return this.svc.actualizarContrato(id, { fichaInformconfUrl: `/uploads/fichas/${file.filename}` } as any);
  }

  @Post(':id/ficha-infocheck/upload')
  @UseInterceptors(FileInterceptor('file', uploadsConfig('fichas', 'infocheck')))
  async uploadInfocheck(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió archivo');
    return this.svc.actualizarContrato(id, { fichaInfocheckUrl: `/uploads/fichas/${file.filename}` } as any);
  }
}
