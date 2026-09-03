import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsISO8601, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateOliveEntryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  bagCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  adhlefCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;

  @ApiPropertyOptional({ description: 'الوزن الإجمالي للعملية (كغ)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @ApiPropertyOptional({ description: 'آخر تحديث معروف — للكشف عن التعارض' })
  @IsOptional()
  @IsISO8601()
  expectedUpdatedAt?: string;
}
