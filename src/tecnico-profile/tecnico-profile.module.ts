import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TecnicoService } from './tecnico.service';
import { TecnicoController } from './tecnico.controller';
import { UploadModule } from '../upload/upload.module';
import { Tecnico, TecnicoSchema } from './schemas/tecnico.schema';
// 1. Importar el Schema del Perfil
import { TecnicoProfile, TecnicoProfileSchema } from '../tecnico-profile/schemas/tecnico-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tecnico.name, schema: TecnicoSchema },
      // 2. Registrar el modelo de perfil aquí también
      { name: TecnicoProfile.name, schema: TecnicoProfileSchema }, 
    ]),
    UploadModule,
  ],
  controllers: [TecnicoController],
  providers: [TecnicoService],
  exports: [TecnicoService],
})
<<<<<<< HEAD
export class TecnicoProfileModule {}
=======
export class TecnicoModule {}
>>>>>>> 7f1578ed06104a99b10323133f6b57b23089dc6a
