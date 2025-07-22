import { Controller, Post, Get, Put, Delete, Body, Param, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { SqsService } from '../services/sqs.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateOrderDto, UpdateOrderDto } from '@/dto/order.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly sqsService: SqsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createOrder(@Body() createOrderDto: CreateOrderDto, @Res() res: Response) {
    const correlationId = uuidv4();
    const event = {
      type: 'ORDER_CREATE',
      correlationId,
      data: createOrderDto,
      timestamp: new Date().toISOString()
    };

    try {
      // Wait for response from Orders microservice
      const response = await this.sqsService.publishEventAndWaitForResponse('orders', event, 30000);
      
      res.status(HttpStatus.CREATED).json({
        message: 'Order created successfully',
        data: response.data,
        correlationId: response.correlationId
      });

    } catch (error) {
      console.error('Error creating order:', error);
      
      if (error.message.includes('timeout')) {
        res.status(HttpStatus.REQUEST_TIMEOUT).json({
          message: 'Request timeout - Orders service did not respond in time',
          correlationId,
          error: 'TIMEOUT'
        });
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Failed to create order',
          correlationId,
          error: error.message
        });
      }
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(@Param('id') id: string, @Res() res: Response) {
    const correlationId = uuidv4();
    const event = {
      type: 'ORDER_GET',
      correlationId,
      data: { id },
      timestamp: new Date().toISOString()
    };

    try {
      const response = await this.sqsService.publishEventAndWaitForResponse('orders', event, 30000);
      
      res.status(HttpStatus.OK).json({
        message: 'Order retrieved successfully',
        data: response.data,
        correlationId: response.correlationId
      });

    } catch (error) {
      console.error('Error getting order:', error);
      
      if (error.message.includes('timeout')) {
        res.status(HttpStatus.REQUEST_TIMEOUT).json({
          message: 'Request timeout',
          correlationId
        });
      } else if (error.message.includes('not found')) {
        res.status(HttpStatus.NOT_FOUND).json({
          message: 'Order not found',
          correlationId
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'Failed to retrieve order',
          correlationId,
          error: error.message
        });
      }
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update order' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrder(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto, @Res() res: Response) {
    const correlationId = uuidv4();
    const event = {
      type: 'ORDER_UPDATE',
      correlationId,
      data: { id, ...updateOrderDto },
      timestamp: new Date().toISOString()
    };

    try {
      const response = await this.sqsService.publishEventAndWaitForResponse('orders', event, 30000);
      
      res.status(HttpStatus.OK).json({
        message: 'Order updated successfully',
        data: response.data,
        correlationId: response.correlationId
      });

    } catch (error) {
      console.error('Error updating order:', error);
      
      if (error.message.includes('not found')) {
        res.status(HttpStatus.NOT_FOUND).json({
          message: 'Order not found',
          correlationId
        });
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Failed to update order',
          correlationId,
          error: error.message
        });
      }
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete order' })
  @ApiResponse({ status: 200, description: 'Order deleted successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async deleteOrder(@Param('id') id: string, @Res() res: Response) {
    const correlationId = uuidv4();
    const event = {
      type: 'ORDER_DELETE',
      correlationId,
      data: { id },
      timestamp: new Date().toISOString()
    };

    try {
      const response = await this.sqsService.publishEventAndWaitForResponse('orders', event, 30000);
      
      res.status(HttpStatus.OK).json({
        message: 'Order deleted successfully',
        correlationId: response.correlationId
      });

    } catch (error) {
      console.error('Error deleting order:', error);
      
      if (error.message.includes('not found')) {
        res.status(HttpStatus.NOT_FOUND).json({
          message: 'Order not found',
          correlationId
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'Failed to delete order',
          correlationId,
          error: error.message
        });
      }
    }
  }
}
