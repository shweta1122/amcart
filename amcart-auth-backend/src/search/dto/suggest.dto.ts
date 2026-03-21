import { IsString, IsOptional, IsNumber, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SuggestDto {
  @ApiProperty({ description: 'Partial query for autocomplete' })
  @IsString()
  @MinLength(2)
  q: string;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 5;
}
