import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';
import { CreateClientDto } from './create-client.dto';

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @ApiPropertyOptional({ description: 'آخر تحديث معروف — للكشف عن التعارض' })
  @IsOptional()
  @IsISO8601()
  expectedUpdatedAt?: string;
}
