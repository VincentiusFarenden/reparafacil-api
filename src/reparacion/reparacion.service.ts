import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reparacion, ReparacionDocument } from './schemas/reparacion.schema';
import { CreateReparacionDto } from './dto/create-reparacion.dto';
import { UpdateReparacionDto } from './dto/update-reparacion.dto';

@Injectable()
export class ReparacionService {
  constructor(
    @InjectModel(Reparacion.name) private reparacionModel: Model<ReparacionDocument>,
  ) {}

  async create(userId: string, createReparacionDto: CreateReparacionDto): Promise<Reparacion> {
    const newReparacion = new this.reparacionModel({
      ...createReparacionDto,
      usuario: userId, // Asignamos la reparación al usuario del token
    });
    return newReparacion.save();
  }

  async findAll(): Promise<Reparacion[]> {
    return this.reparacionModel.find().populate('usuario', 'nombre email telefono').exec();
  }

  async findByCliente(userId: string): Promise<Reparacion[]> {
    return this.reparacionModel.find({ usuario: userId }).exec();
  }

  async findOne(id: string): Promise<Reparacion> {
    const reparacion = await this.reparacionModel.findById(id).populate('usuario').exec();
    if (!reparacion) {
      throw new NotFoundException(`Reparación con ID ${id} no encontrada`);
    }
    return reparacion;
  }

  async update(id: string, updateReparacionDto: UpdateReparacionDto): Promise<Reparacion> {
    const updated = await this.reparacionModel
      .findByIdAndUpdate(id, updateReparacionDto, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Reparación con ID ${id} no encontrada`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.reparacionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Reparación con ID ${id} no encontrada`);
    }
  }
}