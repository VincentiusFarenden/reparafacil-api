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

    // Si no envían rol, asignamos CLIENTE por defecto
    const userRole = registerDto.role || Role.CLIENTE;

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // 1. Crear User
    const newUser = await this.userModel.create({
      email: registerDto.email,
      password: hashedPassword,
      role: userRole as string, // <--- CORRECCIÓN 1: 'as string' para que no marque error de tipo
    });

    try {
      // 2. Crear Profile según el rol
      // CORRECCIÓN 2: (newUser as any)._id permite acceder al ID sin que TypeScript se queje
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
            certificaciones: registerDto.certificaciones,
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
      // Rollback: Si falla el perfil, borramos el usuario usando (newUser as any)._id
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

  private generateToken(user: any): string {
    // CORRECCIÓN 3: Aseguramos que accedemos al _id correctamente
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