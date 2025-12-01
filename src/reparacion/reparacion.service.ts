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

  // Recibimos userId desde el controller
  async create(userId: string, createReparacionDto: CreateReparacionDto): Promise<Reparacion> {
    return this.reparacionModel.create({
      ...createReparacionDto,
      cliente: new Types.ObjectId(userId), // Vinculación automática
      estado: 'solicitada',
      fechaServicio: new Date()
    });
  }

  async findAll(): Promise<Reparacion[]> {
    return this.reparacionModel.find().populate('cliente', 'email');
  }

  // Buscar solo las reparaciones del usuario logueado
  async findByCliente(userId: string): Promise<Reparacion[]> {
    return this.reparacionModel.find({ cliente: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
  }

  async findOne(id: string): Promise<Reparacion> {
    const reparacion = await this.reparacionModel.findById(id).populate('cliente', 'email');
    if (!reparacion) throw new NotFoundException(`Reparacion ${id} no encontrada`);
    return reparacion;
  }

  async update(id: string, updateDto: UpdateReparacionDto): Promise<Reparacion> {
    return this.reparacionModel.findByIdAndUpdate(id, updateDto, { new: true });
  }
}