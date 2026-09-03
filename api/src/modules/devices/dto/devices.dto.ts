import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CashSessionStatus, DeviceStatus, DeviceWorkspace } from '@prisma/client';

export class ApproveDeviceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  code!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsEnum(DeviceWorkspace)
  workspace!: DeviceWorkspace;

  @IsOptional()
  @IsUUID()
  cashRegisterId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateDeviceDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsEnum(DeviceWorkspace)
  workspace?: DeviceWorkspace;

  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @IsOptional()
  @IsUUID()
  cashRegisterId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}

export class DeviceQueryDto {
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @IsOptional()
  @IsEnum(DeviceWorkspace)
  workspace?: DeviceWorkspace;
}

export class OpenCashSessionDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  openingCash!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CloseCashSessionDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  physicalCash!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CashAdjustDto {
  @IsIn(['IN', 'OUT'])
  direction!: 'IN' | 'OUT';

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CashSessionQueryDto {
  @IsOptional()
  @IsUUID()
  cashRegisterId?: string;

  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @IsOptional()
  @IsEnum(CashSessionStatus)
  status?: CashSessionStatus;

  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class OilDashboardQueryDto {
  @IsOptional()
  @IsUUID()
  cashRegisterId?: string;

  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class CreateCashRegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  code!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateCashRegisterDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
