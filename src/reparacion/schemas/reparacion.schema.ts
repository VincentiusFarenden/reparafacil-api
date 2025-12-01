reparacion.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReparacionDocument = Reparacion & Document;

@Schema({ timestamps: true })
export class Reparacion {
  // Vinculamos directamente al Usuario (User) que se loguea
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  cliente: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  tecnico: Types.ObjectId;

  @Prop({ required: true })
  tipo: string; // Ej: "Refrigerador", "Lavadora"

  @Prop({ required: true })
  direccion: string;

  @Prop({ required: true })
  descripcion: string;

  @Prop({ default: 0, min: 0 })
  costo?: number;

  @Prop({ 
    enum: ['solicitada', 'asignada', 'en-proceso', 'completada', 'cancelada'], 
    default: 'solicitada' 
  })
  estado?: string;

  @Prop()
  fechaServicio?: Date;

  @Prop()
  imagen?: string;

  @Prop()
  imagenThumbnail?: string;
}

export const ReparacionSchema = SchemaFactory.createForClass(Reparacion);

ReparacionSchema.index({ cliente: 1 });
ReparacionSchema.index({ tecnico: 1 });
ReparacionSchema.index({ estado: 1 });
create-reparacion.dto.ts}
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReparacionDto {
  @ApiProperty({
    example: 'Refrigerador',
    description: 'Tipo de electrodoméstico o servicio',
  })
  @IsNotEmpty()
  @IsString()
  tipo: string;

  @ApiProperty({
    example: 'Calle Falsa 123',
    description: 'Dirección donde se realizará el servicio',
  })
  @IsNotEmpty()
  @IsString()
  direccion: string;

  @ApiProperty({
    example: 'No enfría y hace ruido',
    description: 'Descripción del problema',
  })
  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imagen?: string;
}