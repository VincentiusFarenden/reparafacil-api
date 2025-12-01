import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateReparacionDto } from './dto/create-reparacion.dto';
import { UpdateReparacionDto } from './dto/update-reparacion.dto';
import { Reparacion, ReparacionDocument } from './schemas/reparacion.schema';

@Injectable()
export class ReparacionService {
  constructor(
    @InjectModel(Reparacion.name) private reparacionModel: Model<ReparacionDocument>,
  ) {}

  // Recibe userId automáticamente
  async create(userId: string, createReparacionDto: CreateReparacionDto): Promise<Reparacion> {
    const nuevaReparacion = await this.reparacionModel.create({
      ...createReparacionDto,
      cliente: new Types.ObjectId(userId), // Asigna el usuario logueado
      estado: 'solicitada',
      fechaServicio: new Date()
    });
    return nuevaReparacion;
  }

  async findAll(): Promise<Reparacion[]> {
    return this.reparacionModel.find()
      .populate('cliente', 'email') // Solo traemos email del user
      .sort({ createdAt: -1 });
  }
  
  // Buscar reparaciones de un cliente específico
  async findByCliente(userId: string): Promise<Reparacion[]> {
    return this.reparacionModel.find({ cliente: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });
  }

  async findOne(id: string): Promise<Reparacion> {
    const reparacion = await this.reparacionModel.findById(id)
      .populate('cliente', 'email');
    if (!reparacion) {
      throw new NotFoundException(`Reparacion con ID ${id} no encontrado`);
    }
    return reparacion;
  }

  async update(id: string, updateReparacionDto: UpdateReparacionDto): Promise<Reparacion> {
    const reparacion = await this.reparacionModel.findByIdAndUpdate(id, updateReparacionDto, { new: true });
    if (!reparacion) {
      throw new NotFoundException(`Reparacion con ID ${id} no encontrado`);
    }
    return reparacion;
  }

  async remove(id: string): Promise<void> {
    const result = await this.reparacionModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException(`Reparacion con ID ${id} no encontrado`);
    }
  }
}