import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export enum PressingAuditContext {
  PROCESSING = 'processing',
  EXTRACTION = 'extraction',
}

export class CreatePressingDto {
  @ApiProperty()
  @IsUUID()
  oliveEntryId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  oilQuantityL!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zayat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  yieldPercent?: number;

  @ApiPropertyOptional({ description: 'يُحسب تلقائياً: سعر القنطار × عدد القناطير (الوزن÷100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  aidAmount?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  oilCollected?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  /** يحدد صياغة سجل النشاط (معالجة أم تصفية) — لا يُخزَّن */
  @ApiPropertyOptional({ enum: PressingAuditContext })
  @IsOptional()
  @IsEnum(PressingAuditContext)
  auditContext?: PressingAuditContext;
}

export class UpdatePressingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  oilQuantityL?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zayat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  yieldPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  aidAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  oilCollected?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: PressingAuditContext })
  @IsOptional()
  @IsEnum(PressingAuditContext)
  auditContext?: PressingAuditContext;
}

export class PressingQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  unpaidOnly?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  oilNotCollected?: boolean;
}
