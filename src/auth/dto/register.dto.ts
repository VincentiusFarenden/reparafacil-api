import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../enums/roles.enum';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@example.com', description: 'Email del usuario' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  // --- CORRECCIÓN AQUÍ ---
  @ApiPropertyOptional({
    example: Role.CLIENTE,
    description: 'Rol del usuario (Opcional, defecto CLIENTE)',
    enum: Role, // Usamos el Enum completo para Swagger
  })
  @IsOptional()
  @IsEnum(Role) // Usamos el Enum directo, es más compatible
  role?: Role;
  // -----------------------

  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre completo' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ example: '+51 987654321', description: 'Teléfono' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: 'Av. Principal 123', description: 'Dirección' })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({ example: 'Reparación de PCs', description: 'Especialidad (Solo Técnicos)' })
  @ValidateIf((o) => o.role === Role.TECNICO)
  @IsNotEmpty({ message: 'La especialidad es requerida para el rol TECNICO' })
  @IsString()
  especialidad?: string;

  @ApiPropertyOptional({ example: ['Certificado A+'], description: 'Certificaciones' })
  @IsOptional()
  @IsArray()
  certificaciones?: string[];
}