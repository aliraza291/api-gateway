import { Controller, Post, Get, Put, Delete, Body, Param, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { SqsService } from '../services/sqs.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto, UpdateUserDto } from '@/dto/user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly sqsService: SqsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createUser(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    const correlationId = uuidv4();
    const event = {
      type: 'USER_CREATE',
      correlationId,
      data: createUserDto,
      timestamp: new Date().toISOString()
    };

    try {
      // Wait for response from User microservice
      const response = await this.sqsService.publishEventAndWaitForResponse('users', event, 30000);
      
      res.status(HttpStatus.CREATED).json({
        message: 'User created successfully',
        data: response.data,
        correlationId: response.correlationId
      });

    } catch (error) {
      console.error('Error creating user:', error);
      
      if (error.message.includes('timeout')) {
        res.status(HttpStatus.REQUEST_TIMEOUT).json({
          message: 'Request timeout - User service did not respond in time',
          correlationId,
          error: 'TIMEOUT'
        });
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Failed to create user',
          correlationId,
          error: error.message
        });
      }
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id') id: string, @Res() res: Response) {
    const correlationId = uuidv4();
    const event = {
      type: 'USER_GET',
      correlationId,
      data: { id },
      timestamp: new Date().toISOString()
    };

    try {
      const response = await this.sqsService.publishEventAndWaitForResponse('users', event, 30000);
      
      res.status(HttpStatus.OK).json({
        message: 'User retrieved successfully',
        data: response.data,
        correlationId: response.correlationId
      });

    } catch (error) {
      console.error('Error getting user:', error);
      
      if (error.message.includes('timeout')) {
        res.status(HttpStatus.REQUEST_TIMEOUT).json({
          message: 'Request timeout',
          correlationId
        });
      } else if (error.message.includes('not found')) {
        res.status(HttpStatus.NOT_FOUND).json({
          message: 'User not found',
          correlationId
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'Failed to retrieve user',
          correlationId,
          error: error.message
        });
      }
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Res() res: Response) {
    const correlationId = uuidv4();
    const event = {
      type: 'USER_UPDATE',
      correlationId,
      data: { id, ...updateUserDto },
      timestamp: new Date().toISOString()
    };

    try {
      const response = await this.sqsService.publishEventAndWaitForResponse('users', event, 30000);
      
      res.status(HttpStatus.OK).json({
        message: 'User updated successfully',
        data: response.data,
        correlationId: response.correlationId
      });

    } catch (error) {
      console.error('Error updating user:', error);
      
      if (error.message.includes('not found')) {
        res.status(HttpStatus.NOT_FOUND).json({
          message: 'User not found',
          correlationId
        });
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Failed to update user',
          correlationId,
          error: error.message
        });
      }
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(@Param('id') id: string, @Res() res: Response) {
    const correlationId = uuidv4();
    const event = {
      type: 'USER_DELETE',
      correlationId,
      data: { id },
      timestamp: new Date().toISOString()
    };

    try {
      const response = await this.sqsService.publishEventAndWaitForResponse('users', event, 30000);
      
      res.status(HttpStatus.OK).json({
        message: 'User deleted successfully',
        correlationId: response.correlationId
      });

    } catch (error) {
      console.error('Error deleting user:', error);
      
      if (error.message.includes('not found')) {
        res.status(HttpStatus.NOT_FOUND).json({
          message: 'User not found',
          correlationId
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'Failed to delete user',
          correlationId,
          error: error.message
        });
      }
    }
  }
}
