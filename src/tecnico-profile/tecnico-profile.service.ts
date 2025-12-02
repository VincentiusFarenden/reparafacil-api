import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTecnicoProfileDto } from './dto/create-tecnico-profile.dto';
import { UpdateTecnicoProfileDto } from './dto/update-tecnico-profile.dto';
import { TecnicoProfile, TecnicoProfileDocument } from './schemas/tecnico-profile.schema';

@Injectable()
export class TecnicoProfileService {
  constructor(
    @InjectModel(TecnicoProfile.name) private tecnicoProfileModel: Model<TecnicoProfileDocument>,
  ) {}

  async create(userId: string, createDto: CreateTecnicoProfileDto): Promise<TecnicoProfile> {
    const newProfile = await this.tecnicoProfileModel.create({
      user: userId,
      ...createDto,
    });
    return newProfile;
  }

  async findAll(): Promise<TecnicoProfile[]> {
    return this.tecnicoProfileModel.find().populate('user').exec();
  }

  async findByUserId(userId: string): Promise<TecnicoProfile> {
    const profile = await this.tecnicoProfileModel.findOne({ user: userId }).populate('user').exec();
    if (!profile) {
      throw new NotFoundException(`Perfil de técnico no encontrado para el usuario ${userId}`);
    }
    return profile;
  }

  async findById(id: string): Promise<TecnicoProfile> {
    const profile = await this.tecnicoProfileModel.findById(id).populate('user').exec();
    if (!profile) {
      throw new NotFoundException(`Perfil de técnico con ID ${id} no encontrado`);
    }
    return profile;
  }

  async update(userId: string, updateDto: UpdateTecnicoProfileDto): Promise<TecnicoProfile> {
    const profile = await this.tecnicoProfileModel
      .findOneAndUpdate({ user: userId }, updateDto, { new: true })
      .populate('user')
      .exec();

    if (!profile) {
      throw new NotFoundException(`Perfil de técnico no encontrado para el usuario ${userId}`);
    }
    return profile;
  }

  async remove(userId: string): Promise<void> {
    const result = await this.tecnicoProfileModel.findOneAndDelete({ user: userId });
    if (!result) {
      throw new NotFoundException(`Perfil de técnico no encontrado para el usuario ${userId}`);
    }
  }
}