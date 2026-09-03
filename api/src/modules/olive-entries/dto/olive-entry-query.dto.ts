import { ApiPropertyOptional } from '@nestjs/swagger';
import { EntryStatus, OliveType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class OliveEntryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @ApiPropertyOptional({ enum: OliveType })
  @IsOptional()
  @IsEnum(OliveType)
  oliveType?: OliveType;

  @ApiPropertyOptional({ enum: EntryStatus })
  @IsOptional()
  @IsEnum(EntryStatus)
  status?: EntryStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  referenceNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  untreatedOnly?: boolean;

  @ApiPropertyOptional({ description: 'تسجيل مشاهدة تفاصيل الأوزان' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  logView?: boolean;
}
