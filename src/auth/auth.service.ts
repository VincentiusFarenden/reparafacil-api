import { Injectable, UnauthorizedException, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from './enums/roles.enum';
import { User, UserDocument } from './schemas/user.schema';
import { ClienteProfileService } from '../cliente-profile/cliente-profile.service';
import { TecnicoProfileService } from '../tecnico-profile/tecnico-profile.service';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private clienteProfileService: ClienteProfileService,
    private tecnicoProfileService: TecnicoProfileService,
  ) {}

  async onModuleInit() {
    await this.createDefaultAdmin();
  }

  private async createDefaultAdmin() {
    const existingAdmin = await this.userModel.findOne({ email: 'admin@sistema.com' });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin123456', 10);
      await this.userModel.create({
        email: 'admin@sistema.com',
        password: hashedPassword,
        role: Role.ADMIN,
      });
      console.log('Usuario ADMIN creado');
    }
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userModel.findOne({ email: registerDto.email });
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const userRole = registerDto.role || Role.CLIENTE;
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // 1. Crear User
    const newUser = await this.userModel.create({
      email: registerDto.email,
      password: hashedPassword,
      role: userRole as string,
    });

    try {
      // 2. Crear Profile según el rol
      const userId = (newUser as any)._id.toString();

      switch (userRole) {
        case Role.CLIENTE:
          await this.clienteProfileService.create(userId, {
            nombre: registerDto.nombre,
            telefono: registerDto.telefono,
            direccion: registerDto.direccion,
          });
          break;
        case Role.TECNICO:
          await this.tecnicoProfileService.create(userId, {
            nombreCompleto: registerDto.nombre,
            telefono: registerDto.telefono,
            especialidad: registerDto.especialidad,
            certificaciones: registerDto.certificaciones || [],
          });
          break;
      }

      const userObject = newUser.toObject();
      const { password, ...userWithoutPassword } = userObject;

      return {
        user: userWithoutPassword,
        access_token: this.generateToken(userObject),
      };
    } catch (error) {
      // Rollback: Si falla el perfil, borramos el usuario
      await this.userModel.findByIdAndDelete((newUser as any)._id);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.userModel.findOne({ email: loginDto.email }).select('+password');

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const userObject = user.toObject();
    const { password, ...userWithoutPassword } = userObject;

    return {
      user: userWithoutPassword,
      access_token: this.generateToken(userObject),
    };
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    const userObject = user.toObject();
    const { password, ...userWithoutPassword } = userObject;
    return userWithoutPassword;
  }

  // NUEVO: Método para obtener perfil completo con datos del profile
  async getFullProfile(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const userObject = user.toObject();
    let profileData: any = {};

    try {
      // Obtener datos del profile según el rol
      if (user.role === Role.CLIENTE) {
        const clienteProfile = await this.clienteProfileService.findByUserId(userId);
        if (clienteProfile) {
          profileData = {
            nombre: clienteProfile.nombre,
            telefono: clienteProfile.telefono,
            direccion: clienteProfile.direccion,
          };
        }
      } else if (user.role === Role.TECNICO) {
        const tecnicoProfile = await this.tecnicoProfileService.findByUserId(userId);
        if (tecnicoProfile) {
          profileData = {
            nombre: tecnicoProfile.nombreCompleto,
            telefono: tecnicoProfile.telefono,
            especialidad: tecnicoProfile.especialidad,
            certificaciones: tecnicoProfile.certificaciones || [],
          };
        }
      }
    } catch (error) {
      console.error('Error al obtener profile:', error);
    }

    // Retornar en formato que Android espera
    return {
      _id: userObject._id,
      email: userObject.email,
      nombre: profileData.nombre || 'Sin nombre',
      telefono: profileData.telefono || null,
      rol: user.role, // Android espera "rol" no "role"
      direccion: profileData.direccion || null,
      especialidad: profileData.especialidad || null,
      certificaciones: profileData.certificaciones || null,
      activo: userObject.isActive,
      createdAt: userObject.createdAt,
      updatedAt: userObject.updatedAt,
    };
  }

  private generateToken(user: any): string {
    const id = user._id ? user._id.toString() : (user as any).id;
    
    const payload = {
      sub: id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  async getAllUsers() {
    const users = await this.userModel.find().select('-password');
    return users;
  }
}