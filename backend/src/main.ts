import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from 'src/common/interceptors/transform.interceptor';
import { StationSyncInterceptor } from './common/interceptors/stationSync.interceptor';
import { StationService } from './app/stations/station.service';
import { Cache } from '@nestjs/cache-manager';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.useGlobalInterceptors(new StationSyncInterceptor(app.get(StationService), app.get(Cache)));
  app.useGlobalInterceptors(new TransformInterceptor());

  const config = new DocumentBuilder()
    .setTitle('REST API')
    .setDescription('API description')
    .setVersion('0.1')
    .addBearerAuth()
    .build();

  app.enableCors();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  await app.listen(3000);
}

bootstrap();
