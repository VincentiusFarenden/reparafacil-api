import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TecnicoProfileService } from './tecnico-profile.service';
import { TecnicoProfileController } from './tecnico-profile.controller';
import { TecnicoProfile, TecnicoProfileSchema } from './schemas/tecnico-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TecnicoProfile.name, schema: TecnicoProfileSchema },
    ]),
  ],
  controllers: [TecnicoProfileController],
  providers: [TecnicoProfileService],
  exports: [TecnicoProfileService],
})
export class TecnicoProfileModule {}
