import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReparacionDocument = Reparacion & Document;

@Schema({ timestamps: true })
export class Reparacion {
  // Conectamos con 'User' (Auth), no con 'Cliente' (Legacy)
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  cliente: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  tecnico: Types.ObjectId;

  @Prop({ required: true })
  tipo: string;

  @Prop({ required: true })
  direccion: string;

  @Prop({ required: true })
  descripcion: string;

  @Prop({ default: 0 })
  costo?: number;

  @Prop({ 
    enum: ['solicitada', 'asignada', 'en-proceso', 'completada', 'cancelada'], 
    default: 'solicitada' 
  })
  estado?: string;

  @Prop()
  fechaServicio?: Date;
}

export const ReparacionSchema = SchemaFactory.createForClass(Reparacion);
ReparacionSchema.index({ cliente: 1 });