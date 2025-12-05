import { Controller, Post, Body, Get, UseGuards, Request, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil completo del usuario actual' })
  getProfile(@Request() req) {
    // req.user viene del JwtStrategy (userId, email, role)
    return this.authService.getFullProfile(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch('me/photo')
  @ApiOperation({ summary: 'Actualizar URL de foto de perfil' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        fotoPerfil: { type: 'string', example: 'https://midominio.com/uploads/foto.jpg' } 
      } 
    } 
  })
  updatePhoto(@Request() req, @Body('fotoPerfil') fotoPerfil: string) {
    return this.authService.updateProfilePhoto(req.user, fotoPerfil);
  }
}