import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTecnicoDto } from './dto/create-tecnico.dto';
import { UpdateTecnicoDto } from './dto/update-tecnico.dto';
import { Tecnico, TecnicoDocument } from './schemas/tecnico.schema';
// Importar documento del perfil
import { TecnicoProfile, TecnicoProfileDocument } from '../tecnico-profile/schemas/tecnico-profile.schema';

@Injectable()
export class TecnicoService {
  constructor(
    @InjectModel(Tecnico.name) private tecnicoModel: Model<TecnicoDocument>,
    // Inyectar el modelo de Perfil
    @InjectModel(TecnicoProfile.name) private tecnicoProfileModel: Model<TecnicoProfileDocument>,
  ) {}

  async create(createTecnicoDto: CreateTecnicoDto): Promise<Tecnico> {
    return this.tecnicoModel.create(createTecnicoDto);
  }

  // --- MODIFICADO: Leer desde Perfiles ---
  async findAll(): Promise<any[]> {
    // 1. Buscamos en los perfiles registrados por Auth
    const perfiles = await this.tecnicoProfileModel.find().populate('usuario').exec();
    
    // 2. Mapeamos para que tenga el formato que espera la App (Tecnico)
    return perfiles.map(perfil => ({
      _id: perfil._id, // O perfil.usuario._id si prefieres usar el ID del usuario
      nombre: perfil.nombreCompleto, // Mapeamos nombreCompleto -> nombre
      email: (perfil.usuario as any)?.email || 'Sin email',
      especialidad: perfil.especialidad,
      telefono: perfil.telefono,
      // Otros campos por defecto
      calificacion: 0, 
      imagen: ''
    }));
  }

  async findOne(id: string): Promise<any> {
    // Intentar buscar primero en perfiles
    const perfil = await this.tecnicoProfileModel.findById(id).populate('usuario').exec();
    if (perfil) {
        return {
            _id: perfil._id,
            nombre: perfil.nombreCompleto,
            email: (perfil.usuario as any)?.email,
            especialidad: perfil.especialidad,
            telefono: perfil.telefono
        };
    }

    // Fallback a la colección antigua
    const tecnico = await this.tecnicoModel.findById(id);
    if (!tecnico) {
      throw new NotFoundException(`Tecnico con ID ${id} no encontrado`);
    }
    return tecnico;
  }

  async update(id: string, updateTecnicoDto: UpdateTecnicoDto): Promise<Tecnico> {
    const tecnico = await this.tecnicoModel.findByIdAndUpdate(id, updateTecnicoDto, { new: true });
    if (!tecnico) {
      throw new NotFoundException(`Tecnico con ID ${id} no encontrado`);
    }
    return tecnico;
  }

  async remove(id: string): Promise<void> {
    const result = await this.tecnicoModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException(`Tecnico con ID ${id} no encontrado`);
    }
  }
}