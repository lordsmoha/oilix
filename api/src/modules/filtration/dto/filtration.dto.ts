import { IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { OliveType } from '@prisma/client';

export class CreateFiltrationDto {
  @ApiProperty({ enum: OliveType, description: 'نوع الزيتون' })
  @IsEnum(OliveType)
  oliveType!: OliveType;

  @ApiPropertyOptional({ description: 'رقم العملية — يُولَّد تلقائياً إن لم يُمرَّر' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  referenceNumber?: number;

  @ApiProperty({ description: 'اسم ولقب الزيات / المرشّح' })
  @IsString()
  @MinLength(2)
  zayatName!: string;

  @ApiPropertyOptional({ description: 'المنطقة' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ description: 'الكمية باللتر' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantityL!: number;

  @ApiPropertyOptional({ description: 'الخلاف' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  khallaf?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateFiltrationDto extends PartialType(CreateFiltrationDto) {}

export class FiltrationQueryDto {
  @ApiPropertyOptional({ enum: OliveType })
  @IsOptional()
  @IsEnum(OliveType)
  oliveType?: OliveType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zayatName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
