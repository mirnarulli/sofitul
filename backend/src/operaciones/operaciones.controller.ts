import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req,
         UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
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
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dir = join(process.cwd(), 'uploads', 'contratos');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `contrato-${req.params.id}-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
      const ext = extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) return cb(null, true);
      cb(new BadRequestException('Solo se aceptan PDF, JPG o PNG'), false);
    },
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  }))
  async uploadContrato(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió archivo');
    const url = `/uploads/contratos/${file.filename}`;
    return this.svc.actualizarContrato(id, { contratoTeDescuentoUrl: url });
  }
}
