import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar validaciones y transformación automática de tipos globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configuración de Swagger para documentar el Monolito Modular
  const config = new DocumentBuilder()
    .setTitle('PhishWarden API')
    .setDescription('Documentación de la API RESTful para la plataforma PhishWarden')
    .setVersion('1.0')
    .addTag('auth')
    .addTag('empresas')
    .addTag('empleados')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();