import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReparacionDocument = Reparacion & Document;

@Schema({ timestamps: true })
export class Reparacion {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  usuario: Types.ObjectId; // El cliente que solicita

  @Prop({ required: true })
  tipo: string; // Ej: Refrigerador, Lavadora

  @Prop({ required: true })
  descripcion: string;

  @Prop({ required: true })
  direccion: string;

  @Prop({ default: 'pendiente' }) // pendiente, en_progreso, completado, cancelado
  estado: string;

  @Prop()
  imagen?: string; // URL de la imagen (opcional)

  @Prop({ type: Types.ObjectId, ref: 'User' })
  tecnico?: Types.ObjectId; // Técnico asignado (opcional al inicio)

  @Prop()
  fechaVisita?: Date;

  @Prop()
  costoEstimado?: number;
}

export const ReparacionSchema = SchemaFactory.createForClass(Reparacion);