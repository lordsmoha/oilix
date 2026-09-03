import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OliveType, Permission } from '@prisma/client';
import { ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ReqClientSource } from '../../common/decorators/client-source.decorator';
import type { ClientSource } from '../../common/constants/client-source';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateOliveEntryDto } from './dto/create-olive-entry.dto';
import { ClientBoardQueryDto } from './dto/client-board-query.dto';
import { OliveEntryQueryDto } from './dto/olive-entry-query.dto';
import { UpdateOliveEntryDto } from './dto/update-olive-entry.dto';
import { OliveEntriesService } from './olive-entries.service';

@ApiTags('استقبال الزيتون')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('olive-entries')
export class OliveEntriesController {
  constructor(private oliveEntriesService: OliveEntriesService) {}

  @Get('client-board')
  @RequirePermissions(Permission.OLIVE_READ)
  @ApiOperation({ summary: 'لوحة الزبائن (تجميع الأوزان حسب الزبون)' })
  clientBoard(@Query() query: ClientBoardQueryDto) {
    return this.oliveEntriesService.clientBoard(query);
  }

  @Get()
  @RequirePermissions(Permission.OLIVE_READ)
  @ApiOperation({ summary: 'قائمة عمليات الاستقبال' })
  findAll(@Query() query: OliveEntryQueryDto, @CurrentUser() user: JwtPayload) {
    return this.oliveEntriesService.findAll(query, user.sub);
  }

  @Get('next-reference')
  @RequirePermissions(Permission.OLIVE_READ)
  @ApiOperation({ summary: 'الرقم المرجعي التالي حسب النوع' })
  @ApiQuery({ name: 'oliveType', enum: OliveType, required: false })
  nextReference(@Query('oliveType') oliveType?: OliveType) {
    return this.oliveEntriesService.nextReference(oliveType);
  }

  @Get(':id')
  @RequirePermissions(Permission.OLIVE_READ)
  findOne(@Param('id') id: string) {
    return this.oliveEntriesService.findOne(id);
  }

  @Post()
  @RequirePermissions(Permission.OLIVE_WRITE)
  create(
    @Body() dto: CreateOliveEntryDto,
    @CurrentUser() user: JwtPayload,
    @ReqClientSource() source: ClientSource,
  ) {
    return this.oliveEntriesService.create(dto, user.sub, source);
  }

  @Patch(':id')
  @RequirePermissions(Permission.OLIVE_WRITE)
  @ApiOperation({ summary: 'تعديل عملية استقبال / وزنة' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOliveEntryDto,
    @CurrentUser() user: JwtPayload,
    @ReqClientSource() source: ClientSource,
  ) {
    return this.oliveEntriesService.update(id, dto, user.sub, source);
  }

  @Delete(':id')
  @RequirePermissions(Permission.OLIVE_WRITE)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.oliveEntriesService.remove(id, user.sub);
  }
}
