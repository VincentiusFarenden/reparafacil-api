import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as multipart from '@fastify/multipart';
import * as cluster from 'cluster';
import * as os from 'os';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProduction = process.env.NODE_ENV === 'production';

  // Lógica del Cluster "Seguro" para Render Free
  // @ts-ignore
  if (cluster.isPrimary && isProduction) {
    const detectedCPUs = os.cpus().length;
    // LIMITAMOS A 2 WORKERS PARA NO AGOTAR LA RAM DE 512MB
    const maxSafeWorkers = 2; 
    const numWorkers = Math.min(detectedCPUs, maxSafeWorkers);
    
    logger.log(`Primary server started. Detected CPUs: ${detectedCPUs}. Starting ${numWorkers} workers (Safe Mode)...`);

    for (let i = 0; i < numWorkers; i++) {
      // @ts-ignore
      cluster.fork();
    }

    // @ts-ignore
    cluster.on('exit', (worker, code, signal) => {
      logger.warn(`Worker ${worker.process.pid} died. Restarting...`);
      // @ts-ignore
      cluster.fork();
    });
  } else {
    // Lógica normal de la App (Worker)
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter({ logger: true }),
    );

    await app.register(multipart, {
      limits: { fileSize: 5 * 1024 * 1024 },
    });

    app.enableCors();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.setGlobalPrefix('api');
    const configService = app.get(ConfigService);

    const config = new DocumentBuilder()
      .setTitle('ReparaFacil API')
      .setDescription('Documentación API REST - Grupo 8')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
      .addTag('Endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || configService.get<number>('PORT') || 3000;
    await app.listen(port, '0.0.0.0');
    logger.log(`Worker ${process.pid} listening on port ${port}`);
  }
}
bootstrap();