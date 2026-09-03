import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PurgeDatabaseDto } from './dto/purge-database.dto';
import { NewSeasonDto, UpdateSettingsDto } from './dto/update-settings.dto';
import { SETTING_KEYS, SettingsService } from './settings.service';

@ApiTags('الإعدادات')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @RequirePermissions(Permission.SETTINGS_READ)
  @ApiOperation({ summary: 'الإعدادات' })
  getAll() {
    return this.settingsService.getAll();
  }

  @Put()
  @RequirePermissions(Permission.SETTINGS_WRITE)
  @ApiOperation({ summary: 'تحديث الإعدادات' })
  async update(
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (dto.pricePerQuintal !== undefined) {
      await this.settingsService.set(
        SETTING_KEYS.PRICE_PER_QUINTAL,
        dto.pricePerQuintal,
        user.sub,
      );
    }
    if (dto.companyName !== undefined) {
      await this.settingsService.set(
        SETTING_KEYS.COMPANY_NAME,
        dto.companyName,
        user.sub,
      );
    }
    if (dto.companyPhone !== undefined) {
      await this.settingsService.set(
        SETTING_KEYS.COMPANY_PHONE,
        dto.companyPhone,
        user.sub,
      );
    }
    if (dto.companyAddress !== undefined) {
      await this.settingsService.set(
        SETTING_KEYS.COMPANY_ADDRESS,
        dto.companyAddress,
        user.sub,
      );
    }
    return this.settingsService.getAll();
  }

  @Post('new-season')
  @RequirePermissions(Permission.SETTINGS_WRITE)
  @ApiOperation({ summary: 'بدء موسم جديد' })
  newSeason(@Body() dto: NewSeasonDto, @CurrentUser() user: JwtPayload) {
    return this.settingsService.startNewSeason(dto.name, user.sub);
  }

  @Post('purge-database')
  @RequirePermissions(Permission.BACKUP_RESTORE)
  @ApiOperation({
    summary: 'تفريغ قاعدة البيانات (مدير فقط — لا رجوع)',
  })
  purgeDatabase(
    @Body() dto: PurgeDatabaseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.settingsService.purgeDatabase(
      user.sub,
      user.role,
      dto.confirmPhrase,
    );
  }
}
