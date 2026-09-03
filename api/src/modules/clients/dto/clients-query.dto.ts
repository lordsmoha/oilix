import { ApiPropertyOptional } from '@nestjs/swagger';
import { OliveType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class ClientsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OliveType })
  @IsOptional()
  @IsEnum(OliveType)
  oliveType?: OliveType;
}
