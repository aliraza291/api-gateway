import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { config } from 'dotenv';

config();

let app: any;

async function createApp() {
  if (!app) {
    app = await NestFactory.create(AppModule);
    
    app.enableCors();
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
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await createApp();
    const expressApp = app.getHttpAdapter().getInstance();
    
    // Handle the request using Express
    return expressApp(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}