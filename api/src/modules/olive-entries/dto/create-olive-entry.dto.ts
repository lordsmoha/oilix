import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OliveType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class EntryWeightDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  bagNumber!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  weightKg!: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  weighRound?: number;
}

export class CreateOliveEntryDto {
  @ApiProperty()
  @IsUUID()
  clientId!: string;

  @ApiProperty({ enum: OliveType })
  @IsEnum(OliveType)
  oliveType!: OliveType;

  @ApiProperty()
  @IsInt()
  @Min(1)
  bagCount!: number;

  @ApiProperty({ description: 'عدد الضلف (إجباري)' })
  @IsInt()
  @Min(0)
  adhlefCount!: number;

  @ApiProperty({ description: 'السعة (إجباري)' })
  @IsNumber()
  @Min(0)
  capacity!: number;

  @ApiProperty({ type: [EntryWeightDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EntryWeightDto)
  weights!: EntryWeightDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
