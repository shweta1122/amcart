import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty({ description: 'Product ID (from Platzi API or your DB)' })
  @IsString()
  productId: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity?: number = 1;

  @ApiProperty({ description: 'Product price at time of adding' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productImage?: string;
}

export class UpdateCartItemDto {
  @ApiProperty({ description: 'New quantity' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}