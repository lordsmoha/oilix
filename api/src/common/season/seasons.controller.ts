import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import { CurrentUser } from '../decorators/current-user.decorator';
import {
  RequireAnyPermissions,
  RequirePermissions,
} from '../decorators/permissions.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import type { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';
import { SettingsService } from '../../modules/settings/settings.service';
import { SeasonScopeService } from './season-scope.service';

@ApiTags('المواسم')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('seasons')
export class SeasonsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly seasonScope: SeasonScopeService,
  ) {}

  @Get()
  @RequireAnyPermissions(Permission.OLIVE_READ, Permission.OIL_SALES_ACCESS)
  @ApiOperation({ summary: 'قائمة المواسم' })
  list() {
    return this.settingsService.listSeasons();
  }

  @Get('context')
  @RequireAnyPermissions(Permission.OLIVE_READ, Permission.OIL_SALES_ACCESS)
  @ApiOperation({ summary: 'الموسم المعروض والوضع (قراءة فقط أو نشط)' })
  context() {
    return this.seasonScope.getContext();
  }

  @Post(':id/log-view')
  @RequireAnyPermissions(Permission.OLIVE_READ, Permission.OIL_SALES_ACCESS)
  @ApiOperation({ summary: 'تسجيل مشاهدة أرشيف موسم' })
  logView(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.settingsService.logSeasonArchiveView(id, user.sub);
  }
}
