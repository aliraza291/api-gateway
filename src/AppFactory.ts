import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import { Express } from 'express';
import { INestApplication } from '@nestjs/common';

config();

export class AppFactory {
  static create(): {
    appPromise: Promise<INestApplication<any>>;
    expressApp: Express;
  } {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    const appPromise = NestFactory.create(AppModule, adapter);

    appPromise
      .then(async (app) => {
        app.enableCors({
          exposedHeaders: '*',
        });

        app.setGlobalPrefix('api');

        const swaggerConfig = new DocumentBuilder()
          .setTitle('Microservices API Gateway')
          .setDescription('API Gateway for microservices architecture')
          .setVersion('1.0')
          .addTag('users')
          .addTag('orders')
          .build();

        const document = SwaggerModule.createDocument(app, swaggerConfig);
        SwaggerModule.setup('docs', app, document);

        await app.init();

        if (process.env.NODE_ENV !== 'production') {
          const port = process.env.PORT || 3000;
          await app.listen(port, '0.0.0.0');
          console.log(`API Gateway running on http://localhost:${port}`);
          console.log(`Swagger UI available at http://localhost:${port}/docs`);
        }
      })
      .catch((err) => {
        console.error('Failed to initialize app:', err);
      });

    // Middleware to ensure app is initialized before handling requests
    expressApp.use((req: Request, res: Response, next) => {
      appPromise
        .then(async (app) => {
          await app.init();
          next();
        })
        .catch((err) => next(err));
    });

    return { appPromise, expressApp };
  }
}
