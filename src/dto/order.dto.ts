import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  userId: string;

  @ApiProperty({ example: ['item1', 'item2'] })
  @IsArray()
  items: string[];

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  total: number;
}

export class UpdateOrderDto {
  @ApiProperty({ example: ['item1', 'item2'], required: false })
  @IsArray()
  @IsOptional()
  items?: string[];

  @ApiProperty({ example: 99.99, required: false })
  @IsNumber()
  @IsOptional()
  total?: number;

  @ApiProperty({ example: 'completed', required: false })
  @IsString()
  @IsOptional()
  status?: string;
}