import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiPropertyOptional({ description: 'Shipping address for the order' })
  @IsOptional()
  @IsString()
  shippingAddress?: string;
}
