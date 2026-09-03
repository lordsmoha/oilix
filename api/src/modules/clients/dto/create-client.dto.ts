import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OliveType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ enum: OliveType, description: 'نوع الزيتون — يحدد تسلسل الترقيم' })
  @IsEnum(OliveType)
  oliveType!: OliveType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiPropertyOptional({ description: 'رقم الهاتف (اختياري)' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'ملاحظات الزبون (اختياري)' })
  @IsOptional()
  @IsString()
  notes?: string;
}
