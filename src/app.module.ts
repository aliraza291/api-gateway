import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersController } from './controllers/users.controller';
import { OrdersController } from './controllers/orders.controller';
import { SqsService } from './services/sqs.service';

@Module({
  imports: [],
  controllers: [AppController, UsersController, OrdersController],
  providers: [AppService,SqsService],
})
export class AppModule {}
