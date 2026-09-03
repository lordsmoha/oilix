import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { CreatePressingDto, UpdatePressingDto } from './create-pressing.dto';

export class CancelEntryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class QuickPressingUpdateDto extends UpdatePressingDto {}

export { CreatePressingDto };
