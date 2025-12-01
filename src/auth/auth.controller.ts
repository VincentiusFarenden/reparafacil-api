import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
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

  // ======================================================
  // ENDPOINTS PARA ANDROID (APP MÓVIL)
  // ======================================================

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar usuario desde Android' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  async signup(@Body() registerDto: RegisterDto) {
    // 1. Llamamos al servicio (él se encarga de los roles y perfiles ahora)
    const result = await this.authService.register(registerDto);

    // 2. Obtenemos el perfil completo fusionado para devolverlo a la App
    const userId = (result.user as any)._id.toString();
    const fullProfile = await this.authService.getFullProfile(userId);

    // 3. Retornamos la estructura EXACTA que espera Retrofit en Android
    return {
      authToken: result.access_token, // Android espera "authToken"
      user: fullProfile,              // Android espera objeto "user"
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión desde Android' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto) {
    // 1. Validar credenciales
    const result = await this.authService.login(loginDto);

    // 2. Obtener perfil completo fusionado
    const userId = (result.user as any)._id.toString();
    const fullProfile = await this.authService.getFullProfile(userId);

    // 3. Retornar estructura para Android
    return {
      authToken: result.access_token,
      user: fullProfile,
    };
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener mi perfil completo' })
  @ApiResponse({ status: 200, description: 'Perfil obtenido' })
  async getMe(@CurrentUser() user: any) {
    // Devuelve el objeto usuario fusionado con datos del perfil (dirección, etc.)
    return this.authService.getFullProfile(user.userId);
  }

  // ======================================================
  // ENDPOINTS LEGACY / WEB (Compatibilidad)
  // ======================================================

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registro Genérico (Web/Admin)' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      success: true,
      message: 'Usuario registrado exitosamente',
      data: result,
    };
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener perfil básico' })
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
  @ApiOperation({ summary: 'Listar usuarios (Solo Admin)' })
  async getAllUsers() {
    const users = await this.authService.getAllUsers();
    return {
      success: true,
      data: users,
    };
  }
}