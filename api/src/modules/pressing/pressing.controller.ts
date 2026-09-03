import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CancelEntryDto } from './dto/processing-actions.dto';
import {
  CreatePressingDto,
  PressingQueryDto,
  UpdatePressingDto,
} from './dto/create-pressing.dto';
import { ProcessingQueryDto } from './dto/processing-query.dto';
import { PressingService } from './pressing.service';

@ApiTags('العصر والتصفية')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pressing')
export class PressingController {
  constructor(private pressingService: PressingService) {}

  @Get('board')
  @RequirePermissions(Permission.PRESSING_READ)
  @ApiOperation({ summary: 'جدول المعالجة (العصر)' })
  board(@Query() query: ProcessingQueryDto) {
    return this.pressingService.findProcessingBoard(query);
  }

  @Get('by-client')
  @RequirePermissions(Permission.PRESSING_READ)
  @ApiOperation({ summary: 'سجلات العصر مجمّعة حسب الزبون' })
  findByClient(@Query() query: PressingQueryDto) {
    return this.pressingService.findAllByClient(query);
  }

  @Get()
  @RequirePermissions(Permission.PRESSING_READ)
  @ApiOperation({ summary: 'سجلات العصر' })
  findAll(@Query() query: PressingQueryDto) {
    return this.pressingService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(Permission.PRESSING_READ)
  findOne(@Param('id') id: string) {
    return this.pressingService.findOne(id);
  }

  @Post()
  @RequirePermissions(Permission.PRESSING_WRITE)
  create(@Body() dto: CreatePressingDto, @CurrentUser() user: JwtPayload) {
    return this.pressingService.create(dto, user.sub);
  }

  @Patch(':id')
  @RequirePermissions(Permission.PRESSING_WRITE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePressingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.pressingService.update(id, dto, user.sub);
  }

  @Patch(':id/collect')
  @RequirePermissions(Permission.PRESSING_WRITE)
  @ApiOperation({ summary: 'تسجيل أو استرجاع أخذ الزيت' })
  collect(
    @Param('id') id: string,
    @Query('value') value: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    const next = value === undefined ? true : value !== 'false';
    return this.pressingService.markOilCollected(id, user.sub, next);
  }

  @Patch(':id/pay')
  @RequirePermissions(Permission.PRESSING_WRITE)
  @ApiOperation({ summary: 'تسجيل أو استرجاع الدفع (سالك)' })
  pay(
    @Param('id') id: string,
    @Query('value') value: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    const next = value === undefined ? true : value !== 'false';
    return this.pressingService.markPaid(id, user.sub, next);
  }

  @Post('entries/:entryId/cancel')
  @RequirePermissions(Permission.PRESSING_WRITE)
  @ApiOperation({ summary: 'إلغاء العملية' })
  cancel(
    @Param('entryId') entryId: string,
    @Body() dto: CancelEntryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.pressingService.cancelEntry(entryId, user.sub, dto.reason);
  }

  @Patch('entries/:entryId/non-referential')
  @RequirePermissions(Permission.PRESSING_WRITE)
  @ApiOperation({ summary: 'غير مرجعي' })
  nonReferential(
    @Param('entryId') entryId: string,
    @Query('value') value: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.pressingService.setNonReferential(entryId, value !== 'false', user.sub);
  }
}
