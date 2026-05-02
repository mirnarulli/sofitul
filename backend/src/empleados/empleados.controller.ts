import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, Req, UseGuards, UseInterceptors,
  UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { EmpleadosService } from './empleados.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { CreateDocumentoDto } from './dto/create-documento.dto';

function empleadoDocStorage() {
  return diskStorage({
    destination: (_req, _file, cb) => {
      const dir = join(process.cwd(), 'uploads', 'empleados');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filename: (req: any, file: Express.Multer.File, cb) => {
      const id = (req.params?.id as string | undefined) ?? 'new';
      const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `emp-${id}-${suffix}${extname(file.originalname)}`);
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

const UPLOAD_OPTS = { storage: empleadoDocStorage(), fileFilter: docFileFilter, limits: { fileSize: 20 * 1024 * 1024 } };

@Controller('empleados')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmpleadosController {
  constructor(private svc: EmpleadosService) {}

  @Get()
  findAll(@Query('q') q?: string) { return this.svc.findAll(q); }

  @Get('cobradores')
  findCobradores() { return this.svc.findCobradores(); }

  @Get(':id')
  findById(@Param('id') id: string) { return this.svc.findById(id); }

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(@Body() b: CreateEmpleadoDto, @Req() req: any) {
    return this.svc.create(b, req.user?.sub ?? req.user?.id);
  }

  @Put(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() b: UpdateEmpleadoDto) { return this.svc.update(id, b); }

  @Post(':id/documentos')
  @Roles('SUPERADMIN', 'ADMIN')
  addDocumento(@Param('id') id: string, @Body() b: CreateDocumentoDto) {
    return this.svc.addDocumento(id, b);
  }

  @Put('documentos/:docId')
  @Roles('SUPERADMIN', 'ADMIN')
  updateDocumento(@Param('docId') docId: string, @Body() b: Partial<CreateDocumentoDto>) {
    return this.svc.updateDocumento(docId, b);
  }

  @Delete('documentos/:docId')
  @Roles('SUPERADMIN', 'ADMIN')
  deleteDocumento(@Param('docId') docId: string) { return this.svc.deleteDocumento(docId); }

  @Post(':id/documentos/:docId/upload')
  @Roles('SUPERADMIN', 'ADMIN')
  @UseInterceptors(FileInterceptor('file', UPLOAD_OPTS))
  async uploadDocumento(
    @Param('id') _id: string,
    @Param('docId') docId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = `/uploads/empleados/${file.filename}`;
    return this.svc.setDocumentoUrl(docId, url);
  }
}
