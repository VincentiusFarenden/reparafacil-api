import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from './enums/roles.enum';
import { ClienteProfile } from '../cliente-profile/schemas/cliente-profile.schema';
import { TecnicoProfile } from '../tecnico-profile/schemas/tecnico-profile.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ClienteProfile.name) private clienteProfileModel: Model<ClienteProfile>,
    @InjectModel(TecnicoProfile.name) private tecnicoProfileModel: Model<TecnicoProfile>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, nombre, rol, ...profileData } = registerDto;

    const emailExists = await this.userModel.findOne({ email });
    if (emailExists) {
      throw new BadRequestException('El correo ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 1. Crear el usuario base
    const user = await this.userModel.create({
      email,
      password: hashedPassword,
      role: rol,
    });

    try {
      // 2. Crear perfil asociado (CORREGIDO: 'user' en vez de 'usuario')
      if (rol === Role.CLIENTE) {
        await this.clienteProfileModel.create({
          user: user._id, // <--- Aquí estaba el error
          nombre,
          telefono: profileData.telefono,
          direccion: profileData.direccion,
        });
      } else if (rol === Role.TECNICO) {
        await this.tecnicoProfileModel.create({
          user: user._id, // <--- Aquí estaba el error
          nombre,
          telefono: profileData.telefono,
          especialidad: profileData.especialidad,
          certificaciones: profileData.certificaciones,
        });
      }
    } catch (error) {
      // ROLLBACK: Si falla crear el perfil, borramos el usuario para no dejar datos corruptos
      await this.userModel.findByIdAndDelete(user._id);
      throw new BadRequestException('Error al crear el perfil: ' + error.message);
    }

    const token = this.jwtService.sign({ sub: user._id, email: user.email, role: rol });
    return { authToken: token };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    // Necesitamos el password explícitamente porque en el schema tiene select: false
    const user = await this.userModel.findOne({ email }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const role = user.role;
    const token = this.jwtService.sign({ sub: user._id, email: user.email, role });
    return { authToken: token };
  }

  // === MÉTODOS PARA PERFIL Y FOTO ===

  async getFullProfile(userPayload: any) {
    const { userId, role, email } = userPayload;
    let profileData: any = {};

    // CORRECCIÓN: Usamos 'user' para buscar en la BD
    if (role === Role.CLIENTE) {
      profileData = await this.clienteProfileModel.findOne({ user: userId }).lean();
    } else if (role === Role.TECNICO) {
      profileData = await this.tecnicoProfileModel.findOne({ user: userId }).lean();
    }

    if (!profileData) {
      return { id: userId, email, rol: role };
    }

    return {
      id: userId,
      email,
      rol: role,
      nombre: profileData.nombre,
      telefono: profileData.telefono,
      direccion: profileData.direccion,
      especialidad: profileData.especialidad,
      fotoPerfil: profileData.fotoPerfil,
    };
  }

  async updateProfilePhoto(userPayload: any, photoUrl: string) {
    const { userId, role } = userPayload;

    // CORRECCIÓN: Usamos 'user' para buscar y actualizar
    if (role === Role.CLIENTE) {
      await this.clienteProfileModel.findOneAndUpdate(
        { user: userId },
        { fotoPerfil: photoUrl }
      );
    } else if (role === Role.TECNICO) {
      await this.tecnicoProfileModel.findOneAndUpdate(
        { user: userId },
        { fotoPerfil: photoUrl }
      );
    }
    
    return this.getFullProfile(userPayload);
  }
}