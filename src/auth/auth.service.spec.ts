import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { User } from './schemas/user.schema';
import { Role } from './enums/roles.enum';
import { ClienteProfileService } from '../cliente-profile/cliente-profile.service';
import { TecnicoProfileService } from '../tecnico-profile/tecnico-profile.service';
import * as bcrypt from 'bcrypt';

// Mock de bcrypt para no procesar hashes reales en los tests
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let clienteProfileService: any;
  let tecnicoProfileService: any;

  // Mocks de las dependencias
  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mocked_token'),
  };

  const mockClienteProfileService = {
    create: jest.fn(),
    findByUserId: jest.fn(),
  };

  const mockTecnicoProfileService = {
    create: jest.fn(),
    findByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ClienteProfileService, useValue: mockClienteProfileService },
        { provide: TecnicoProfileService, useValue: mockTecnicoProfileService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken(User.name));
    clienteProfileService = module.get(ClienteProfileService);
    tecnicoProfileService = module.get(TecnicoProfileService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@test.com',
      password: 'password123',
      nombre: 'Test User',
      rol: Role.CLIENTE,
      telefono: '123456789',
    };

    it('debe lanzar ConflictException si el email ya existe', async () => {
      mockUserModel.findOne.mockResolvedValue({ email: 'test@test.com' }); // Usuario existe

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('debe crear un usuario y un perfil de CLIENTE exitosamente', async () => {
      mockUserModel.findOne.mockResolvedValue(null); // Usuario no existe
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      
      const createdUser = {
        _id: 'user_id_123',
        ...registerDto,
        password: 'hashed_password',
        toObject: function() { return this; }
      };
      mockUserModel.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(mockUserModel.create).toHaveBeenCalled();
      // Verifica que se llamó al servicio de perfil de cliente, no al de técnico
      expect(clienteProfileService.create).toHaveBeenCalledWith('user_id_123', expect.objectContaining({
        nombre: registerDto.nombre
      }));
      expect(tecnicoProfileService.create).not.toHaveBeenCalled();
      expect(result).toHaveProperty('access_token', 'mocked_token');
    });

    it('debe hacer rollback (borrar usuario) si falla la creación del perfil', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      
      const createdUser = { _id: 'user_id_fail', toObject: jest.fn() };
      mockUserModel.create.mockResolvedValue(createdUser);

      // Simulamos error al crear perfil
      clienteProfileService.create.mockRejectedValue(new Error('Profile Error'));

      await expect(service.register(registerDto)).rejects.toThrow('Profile Error');
      // Verifica que se intentó borrar el usuario "huérfano"
      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith('user_id_fail');
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@test.com', password: 'password123' };

    it('debe retornar token si las credenciales son válidas', async () => {
      const mockUser = {
        _id: 'user_id',
        email: 'test@test.com',
        password: 'hashed_password',
        role: Role.CLIENTE,
        toObject: function() { return this; }
      };

      // Mockear la cadena: findOne -> select -> exec/result
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // Password coincide

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('access_token', 'mocked_token');
    });

    it('debe lanzar UnauthorizedException si el password no coincide', async () => {
      const mockUser = {
        email: 'test@test.com',
        password: 'hashed_password',
        role: Role.CLIENTE,
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Password incorrecto

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});