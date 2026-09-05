import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OliveType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ClientBoardQueryDto {
  @ApiPropertyOptional({ enum: OliveType })
  @IsOptional()
  @IsEnum(OliveType)
  oliveType?: OliveType;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 10000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'بحث بالاسم أو الهاتف أو رقم الزبون' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'عمليات غير معالجة فقط (للتصفية)' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  untreatedOnly?: boolean;

  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 20);
  }
}

