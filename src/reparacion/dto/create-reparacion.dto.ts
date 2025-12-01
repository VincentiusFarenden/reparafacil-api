import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReparacionDto {
  @ApiProperty({ example: 'Refrigerador' })
  @IsNotEmpty()
  @IsString()
  tipo: string;

  @ApiProperty({ example: 'Av. Siempre Viva 123' })
  @IsNotEmpty()
  @IsString()
  direccion: string;

  @ApiProperty({ example: 'No enfría' })
  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imagen?: string;
}