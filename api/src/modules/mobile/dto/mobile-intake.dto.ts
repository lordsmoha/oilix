import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OliveType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class MobileIntakeDto {
  @ApiPropertyOptional({ description: 'معرّف زبون موجود — إن وُجد تُضاف وزنة فقط' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @ApiPropertyOptional({ description: 'رقم الهاتف (اختياري)' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: OliveType })
  @IsEnum(OliveType)
  oliveType!: OliveType;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  weightKg!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  bagCount!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  adhlefCount!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  capacity!: number;

  @ApiPropertyOptional({ description: 'ملاحظات الزبون (اختياري)' })
  @IsOptional()
  @IsString()
  notes?: string;
}
