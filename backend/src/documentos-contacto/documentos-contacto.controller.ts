import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UploadedFile, UseGuards, UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocumentosContactoService } from './documentos-contacto.service';
import { CreateTipoDocumentoAdjuntoDto } from './dto/create-tipo.dto';
import { UpdateTipoDocumentoAdjuntoDto } from './dto/update-tipo.dto';
import { CreateDocumentoContactoDto } from './dto/create-documento.dto';
import { UpdateDocumentoContactoDto } from './dto/update-documento.dto';

// ── Multer config ───────────────────────────────────────────────────────────
function docStorage() {
  return diskStorage({
    destination: (_req, _file, cb) => {
      const dir = join(process.cwd(), 'uploads', 'documentos-contacto');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `doc-${req.params?.id ?? 'new'}-${suffix}${extname(file.originalname)}`);
    },
  });
}

function docFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  const allowedExt  = ['.pdf', '.jpg', '.jpeg', '.png'];
  const allowedMime = ['application/pdf', 'image/jpeg', 'image/png'];
  const extOk  = allowedExt.includes(extname(file.originalname).toLowerCase());
  const mimeOk = allowedMime.includes(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new BadRequestException('Solo se aceptan PDF, JPG o PNG'), false);
}

const UPLOAD_OPTS = { storage: docStorage(), fileFilter: docFileFilter, limits: { fileSize: 20 * 1024 * 1024 } };

// ── Controller ──────────────────────────────────────────────────────────────

@Controller()
@UseGuards(JwtAuthGuard)
export class DocumentosContactoController {
  constructor(private svc: DocumentosContactoService) {}

  // ── Tipos documento adjunto ──

  @Get('tipos-documento-adjunto')
  findAllTipos() { return this.svc.findAllTipos(); }

  @Get('tipos-documento-adjunto/activos')
  findTiposActivos() { return this.svc.findTiposActivos(); }

  @Post('tipos-documento-adjunto')
  createTipo(@Body() b: CreateTipoDocumentoAdjuntoDto) { return this.svc.createTipo(b); }

  @Put('tipos-documento-adjunto/:id')
  updateTipo(@Param('id') id: string, @Body() b: UpdateTipoDocumentoAdjuntoDto) { return this.svc.updateTipo(id, b); }

  // ── Documentos del contacto ──

  @Get('documentos-contacto')
  findByContacto(
    @Query('contactoTipo') contactoTipo: string,
    @Query('contactoId')   contactoId: string,
  ) { return this.svc.findByContacto(contactoTipo, contactoId); }

  /** Crear registro + subir archivo en un solo request (multipart opcional) */
  @Post('documentos-contacto')
  @UseInterceptors(FileInterceptor('file', UPLOAD_OPTS))
  async create(
    @Body() body: CreateDocumentoContactoDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const url = file ? `/uploads/documentos-contacto/${file.filename}` : undefined;
    return this.svc.create({ ...body, ...(url && { url }) });
  }

  /** Actualizar solo metadatos (fecha, observaciones) */
  @Put('documentos-contacto/:id')
  update(@Param('id') id: string, @Body() b: UpdateDocumentoContactoDto) {
    return this.svc.update(id, b);
  }

  @Delete('documentos-contacto/:id')
  delete(@Param('id') id: string) { return this.svc.delete(id); }

  /** Subir o reemplazar el archivo de un documento ya existente */
  @Post('documentos-contacto/:id/upload')
  @UseInterceptors(FileInterceptor('file', UPLOAD_OPTS))
  async upload(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = `/uploads/documentos-contacto/${file.filename}`;
    return this.svc.setUrl(id, url);
  }
}
