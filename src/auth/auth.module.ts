import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { User, UserSchema } from './schemas/user.schema';
import { ClienteProfileModule } from '../cliente-profile/cliente-profile.module';
import { TecnicoProfileModule } from '../tecnico-profile/tecnico-profile.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema }
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '24h',
        },
      }),
    }),
    ClienteProfileModule,
    TecnicoProfileModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,  // ← Solo como provider, NO como APP_GUARD
    RolesGuard,    // ← Solo como provider, NO como APP_GUARD
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard],  // ← Exportar para usar en otros módulos
})
export class AuthModule {}