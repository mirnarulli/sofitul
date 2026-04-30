import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, UploadedFile, Request, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { OperacionInformesRigorService } from './operacion-informes-rigor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const UPLOAD_OPTS = {
  storage: memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowedExt  = ['.pdf', '.jpg', '.jpeg', '.png'];
    const allowedMime = ['application/pdf', 'image/jpeg', 'image/png'];
    const extOk  = allowedExt.includes(extname(file.originalname).toLowerCase());
    const mimeOk = allowedMime.includes(file.mimetype);
    if (extOk && mimeOk) return cb(null, true);
    cb(new BadRequestException('Solo se aceptan PDF, JPG o PNG'), false);
  },
};

@Controller('operacion-informes-rigor')
@UseGuards(JwtAuthGuard)
export class OperacionInformesRigorController {
  constructor(private svc: OperacionInformesRigorService) {}

  /** GET /operacion-informes-rigor?operacionId=xxx */
  @Get()
  findByOperacion(@Query('operacionId') operacionId: string) {
    return this.svc.findByOperacion(operacionId);
  }

  /** POST /operacion-informes-rigor — crear uno */
  @Post()
  create(@Body() b: any) { return this.svc.create(b); }

  /** POST /operacion-informes-rigor/init — crear batch para una operación */
  @Post('init')
  initBatch(@Body() body: { items: any[] }) { return this.svc.initBatch(body.items); }

  /** PUT /operacion-informes-rigor/:id */
  @Put(':id')
  update(@Param('id') id: string, @Body() b: any) { return this.svc.update(id, b); }

  /** POST /operacion-informes-rigor/:id/upload */
  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file', UPLOAD_OPTS))
  upload(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const operadorId     = req.user?.id ?? '';
    const operadorNombre = [req.user?.primerNombre, req.user?.primerApellido].filter(Boolean).join(' ') || 'Sistema';
    return this.svc.upload(id, file, operadorId, operadorNombre);
  }

  /** DELETE /operacion-informes-rigor/:id */
  @Delete(':id')
  delete(@Param('id') id: string) { return this.svc.delete(id); }
}
