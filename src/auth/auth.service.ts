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
    const user = await this.userModel.create({
      email,
      password: hashedPassword,
      roles: [rol],
    });

    // Crear perfil asociado según el rol
    if (rol === Role.CLIENTE) {
      await this.clienteProfileModel.create({
        usuario: user._id,
        nombre,
        telefono: profileData.telefono,
        direccion: profileData.direccion,
      });
    } else if (rol === Role.TECNICO) {
      await this.tecnicoProfileModel.create({
        usuario: user._id,
        nombre,
        telefono: profileData.telefono,
        especialidad: profileData.especialidad,
        certificaciones: profileData.certificaciones,
      });
    }

    const token = this.jwtService.sign({ sub: user._id, email: user.email, role: rol });
    return { authToken: token };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const role = user.roles[0]; // Asumimos un rol principal
    const token = this.jwtService.sign({ sub: user._id, email: user.email, role });
    return { authToken: token };
  }

  // === MÉTODOS PARA PERFIL Y FOTO ===

  async getFullProfile(userPayload: any) {
    const { userId, role, email } = userPayload;
    let profileData: any = {};

    if (role === Role.CLIENTE) {
      profileData = await this.clienteProfileModel.findOne({ usuario: userId }).lean();
    } else if (role === Role.TECNICO) {
      profileData = await this.tecnicoProfileModel.findOne({ usuario: userId }).lean();
    }

    if (!profileData) {
      return { id: userId, email, rol: role };
    }

    // Retornamos un objeto plano unificado para la App
    return {
      id: userId,
      email,
      rol: role,
      nombre: profileData.nombre,
      telefono: profileData.telefono,
      direccion: profileData.direccion,
      especialidad: profileData.especialidad,
      fotoPerfil: profileData.fotoPerfil, // Campo clave para la imagen
    };
  }

  async updateProfilePhoto(userPayload: any, photoUrl: string) {
    const { userId, role } = userPayload;

    if (role === Role.CLIENTE) {
      await this.clienteProfileModel.findOneAndUpdate(
        { usuario: userId },
        { fotoPerfil: photoUrl }
      );
    } else if (role === Role.TECNICO) {
      await this.tecnicoProfileModel.findOneAndUpdate(
        { usuario: userId },
        { fotoPerfil: photoUrl }
      );
    }
    
    // Devolvemos el perfil actualizado
    return this.getFullProfile(userPayload);
  }
}