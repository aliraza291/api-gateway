import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { config } from 'dotenv';

// Load environment variables
config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend integration
  app.enableCors();
  
  // Set global prefix for API routes
  app.setGlobalPrefix('api');
  
  // Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Microservices API Gateway')
    .setDescription('API Gateway for microservices architecture')
    .setVersion('1.0')
    .addTag('users')
    .addTag('orders')
    .build();
  
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
  
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // Bind to all interfaces for deployment
  
  console.log(`API Gateway running on port ${port}`);
  console.log(`Swagger UI available at /docs`);
}

bootstrap().catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});