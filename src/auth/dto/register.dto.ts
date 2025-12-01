import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { Role } from '../enums/roles.enum';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@ejemplo.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre: string;

  @ApiPropertyOptional({ example: '+56912345678' })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiProperty({ 
    example: 'cliente',
    enum: Role,
    description: 'Rol del usuario: cliente o tecnico'
  })
  @IsEnum(Role, { message: 'Rol inválido. Debe ser "cliente" o "tecnico"' })
  @IsNotEmpty({ message: 'El rol es requerido' })
  // IMPORTANTE: Android envía "rol" pero nuestro backend usa "role"
  // Lo mapeamos en el controller
  rol: string;

  @ApiPropertyOptional({ example: 'Calle 123, Santiago' })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiPropertyOptional({ 
    example: 'Reparación de electrodomésticos',
    description: 'Requerido si el rol es "tecnico"'
  })
  @IsString()
  @IsOptional()
  especialidad?: string;

  @ApiPropertyOptional({ 
    example: ['Certificado A', 'Certificado B'],
    type: [String]
  })
  @IsArray()
  @IsOptional()
  certificaciones?: string[];

  // Campo interno que usará el backend
  role?: Role;
}