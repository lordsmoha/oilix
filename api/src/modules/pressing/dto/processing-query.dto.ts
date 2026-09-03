import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OliveType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export enum ProcessingFilter {
  ALL = 'all',
  CUSTOMER = 'customer',
  TAKEN = 'taken',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  UNMILLED = 'unmilled',
  FULL_AID = 'full_aid',
}

export class ProcessingQueryDto extends PaginationQueryDto {
  @ApiProperty({ enum: OliveType })
  @IsEnum(OliveType)
  oliveType!: OliveType;

  @ApiPropertyOptional({ enum: ProcessingFilter, default: ProcessingFilter.ALL })
  @IsOptional()
  @IsEnum(ProcessingFilter)
  filter?: ProcessingFilter = ProcessingFilter.ALL;

  @ApiPropertyOptional({ description: 'بحث بالرقم' })
  @IsOptional()
  @IsString()
  referenceSearch?: string;

  @ApiPropertyOptional({ description: 'بحث بالاسم' })
  @IsOptional()
  @IsString()
  nameSearch?: string;

  @ApiPropertyOptional({ description: 'بحث بالهاتف' })
  @IsOptional()
  @IsString()
  phoneSearch?: string;
}
