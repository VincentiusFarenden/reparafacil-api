import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { Role } from './enums/roles.enum';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('Autenticación')
@Controller('auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // NUEVO: Endpoint /auth/signup que Android espera
  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nuevo usuario (CLIENTE o TÉCNICO)' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  async signup(@Body() registerDto: RegisterDto) {
    // Extraer campos y mapear rol → role
    const { rol, ...rest } = registerDto;
    const role = this.mapRolToRole(rol);

    // Validar especialidad para técnicos
    if (role === Role.TECNICO && !registerDto.especialidad) {
      throw new BadRequestException('La especialidad es requerida para técnicos');
    }

    // Crear objeto con role (no rol)
    const mappedDto = {
      ...rest,
      role,
    };

    const result = await this.authService.register(mappedDto as any);

    // Obtener perfil completo
    const userId = (result.user as any)._id.toString();
    const fullProfile = await this.authService.getFullProfile(userId);

    // Retornar en formato que Android espera
    return {
      authToken: result.access_token,
      user: fullProfile,
    };
  }

  // MANTENER: Endpoint /auth/register (por compatibilidad)
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nuevo CLIENTE' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  async register(@Body() registerDto: RegisterDto) {
    const { rol, ...rest } = registerDto;
    const role = this.mapRolToRole(rol);

    const mappedDto = {
      ...rest,
      role,
    };

    const result = await this.authService.register(mappedDto as any);
    return {
      success: true,
      message: 'Usuario registrado exitosamente',
      data: result,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);

    // Obtener perfil completo
    const userId = (result.user as any)._id.toString();
    const fullProfile = await this.authService.getFullProfile(userId);

    // Retornar en formato que Android espera
    return {
      authToken: result.access_token,
      user: fullProfile,
    };
  }

  // NUEVO: Endpoint /auth/me que Android espera
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener perfil del usuario actual' })
  @ApiResponse({ status: 200, description: 'Perfil obtenido exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getMe(@CurrentUser() user: any) {
    const fullProfile = await this.authService.getFullProfile(user.userId);
    return fullProfile;
  }

  // MANTENER: Endpoint /auth/profile (por compatibilidad)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener perfil del usuario actual' })
  @ApiResponse({ status: 200, description: 'Perfil obtenido exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getProfile(@CurrentUser() user: any) {
    const profile = await this.authService.getProfile(user.userId);
    return {
      success: true,
      data: profile,
    };
  }

  @Get('users')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todos los usuarios (solo ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  @ApiResponse({ status: 403, description: 'Acceso denegado - Solo administradores' })
  async getAllUsers() {
    const users = await this.authService.getAllUsers();
    return {
      success: true,
      data: users,
    };
  }

  // Método auxiliar para mapear roles
  private mapRolToRole(rol: string): Role {
    const roleMap = {
      'cliente': Role.CLIENTE,
      'tecnico': Role.TECNICO,
      'admin': Role.ADMIN,
    };
    return roleMap[rol?.toLowerCase()] || Role.CLIENTE;
  }
}