import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';

let app: any;

async function createApp() {
  if (!app) {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    
    app = await NestFactory.create(AppModule, adapter);
    app.enableCors();
    app.setGlobalPrefix('api');
    await app.init();
  }
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const server = await createApp();
  return server(req, res);
}