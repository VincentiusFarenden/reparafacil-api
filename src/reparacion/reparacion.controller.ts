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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReparacionService } from './reparacion.service';
import { CreateReparacionDto } from './dto/create-reparacion.dto';
import { UpdateReparacionDto } from './dto/update-reparacion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reparacion')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('reparacion')
export class ReparacionController {
  constructor(private readonly reparacionService: ReparacionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nueva solicitud de reparación' })
  @ApiResponse({ status: 201, description: 'Solicitud creada' })
  async create(@Req() req, @Body() createReparacionDto: CreateReparacionDto) {
    // req.user viene del JwtStrategy (userId, email, role)
    const userId = req.user.userId; 
    const data = await this.reparacionService.create(userId, createReparacionDto);
    return {
      success: true,
      message: 'Solicitud creada exitosamente',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar mis reparaciones (Cliente) o todas (Admin/Tecnico)' })
  async findAll(@Req() req) {
    const user = req.user;
    
    // Si es cliente, solo ve las suyas
    if (user.role === 'cliente') {
        const data = await this.reparacionService.findByCliente(user.userId);
        return { success: true, data };
    }

    // Admin o Tecnico ven todas (o podrías filtrar las asignadas al técnico)
    const data = await this.reparacionService.findAll();
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.reparacionService.findOne(id);
    return { success: true, data };
  }
}