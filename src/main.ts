import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { config } from 'dotenv';
config(); 
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const config = new DocumentBuilder()
    .setTitle('Microservices API Gateway')
    .setDescription('API Gateway for microservices architecture')
    .setVersion('1.0')
    .addTag('users')
    .addTag('orders')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
 await app.listen(process.env.PORT || 3000);
  console.log('API Gateway running on http://localhost:3000');
  console.log('Swagger UI available at http://localhost:3000/api');
}
bootstrap();