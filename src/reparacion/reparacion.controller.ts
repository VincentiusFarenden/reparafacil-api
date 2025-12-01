import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { ReparacionService } from './reparacion.service';
import { CreateReparacionDto } from './dto/create-reparacion.dto';
import { UpdateReparacionDto } from './dto/update-reparacion.dto';
import { UploadService } from '../upload/upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reparacion')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('reparacion')
export class ReparacionController {
  constructor(
    private readonly reparacionService: ReparacionService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nueva solicitud de reparación' })
  @ApiResponse({ status: 201, description: 'Solicitud creada exitosamente' })
  async create(@Req() req, @Body() createReparacionDto: CreateReparacionDto) {
    // Obtenemos el ID del usuario desde el Token (inyectado por JwtStrategy)
    const userId = req.user.userId;
    const data = await this.reparacionService.create(userId, createReparacionDto);
    
    return {
      success: true,
      message: 'Solicitud creada exitosamente',
      data,
    };
  }

  @Post(':id/upload-image')
  @ApiOperation({ summary: 'Subir imagen para Reparacion' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'ID de la Reparacion' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Imagen subida exitosamente' })
  async uploadImage(
    @Param('id') id: string,
    @Req() request: FastifyRequest,
  ) {
    const data = await request.file();

    if (!data) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    if (!data.mimetype.startsWith('image/')) {
      throw new BadRequestException('El archivo debe ser una imagen');
    }

    const buffer = await data.toBuffer();
    const file = {
      buffer,
      originalname: data.filename,
      mimetype: data.mimetype,
    } as Express.Multer.File;

    const uploadResult = await this.uploadService.uploadImage(file);
    const updated = await this.reparacionService.update(id, {
      imagen: uploadResult.url,
      // Nota: Asegúrate de que tu schema tenga este campo si lo usas, 
      // si no, el servicio lo ignorará o debes agregarlo al schema/dto.
      // imagenThumbnail: uploadResult.thumbnailUrl, 
    } as any);

    return {
      success: true,
      message: 'Imagen subida y asociada exitosamente',
      data: { reparacion: updated, upload: uploadResult },
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar reparaciones (Filtrado por Rol)' })
  async findAll(@Req() req) {
    const user = req.user;
    
    // Si es CLIENTE, solo devolvemos SUS reparaciones
    if (user.role === 'cliente') {
        const data = await this.reparacionService.findByCliente(user.userId);
        return { success: true, data };
    }

    // Si es TÉCNICO o ADMIN, devolvemos todas
    const data = await this.reparacionService.findAll();
    return { success: true, data, total: data.length };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener Reparacion por ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.reparacionService.findOne(id);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar Reparacion' })
  async update(
    @Param('id') id: string, 
    @Body() updateReparacionDto: UpdateReparacionDto
  ) {
    const data = await this.reparacionService.update(id, updateReparacionDto);
    return {
      success: true,
      message: 'Reparacion actualizada exitosamente',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar Reparacion' })
  async remove(@Param('id') id: string) {
    const reparacion = await this.reparacionService.findOne(id);
    
    // Intentar borrar la imagen si existe
    if (reparacion.imagen) {
      const filename = reparacion.imagen.split('/').pop();
      if (filename) {
        // Envolvemos en try-catch por si la imagen ya no existe en disco
        try {
          await this.uploadService.deleteImage(filename);
        } catch (e) {
          console.warn('No se pudo eliminar la imagen asociada:', e);
        }
      }
    }
    
    await this.reparacionService.remove(id);
    return { success: true, message: 'Reparacion eliminada exitosamente' };
  }
}