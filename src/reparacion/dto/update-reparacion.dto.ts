import { PartialType } from '@nestjs/swagger';
import { CreateReparacionDto } from './create-reparacion.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReparacionDto extends PartialType(CreateReparacionDto) {
  @ApiPropertyOptional({ example: 'en_proceso' })
  @IsOptional()
  @IsString()
  estado?: string;
}