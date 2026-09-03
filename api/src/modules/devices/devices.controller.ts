import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DeviceStatus, Permission } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireAnyPermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { hasPermission } from '../../common/permissions/permission-catalog';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { DevicesService } from './devices.service';
import { ApproveDeviceDto, DeviceQueryDto, UpdateDeviceDto } from './dto/devices.dto';

@ApiTags('الأجهزة')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('devices')
export class DevicesController {
  constructor(private devices: DevicesService) {}

  @Get('me')
  me() {
    return this.devices.me();
  }

  @Get()
  @RequireAnyPermissions(
    Permission.OIL_SALES_DEVICES_VIEW,
    Permission.MILL_DEVICES_VIEW,
    Permission.OIL_SALES_DEVICES_MANAGE,
    Permission.MILL_DEVICES_MANAGE,
  )
  list(@Query() query: DeviceQueryDto, @CurrentUser() user: JwtPayload) {
    this.assertView(user);
    return this.devices.list(query);
  }

  @Get(':id')
  @RequireAnyPermissions(
    Permission.OIL_SALES_DEVICES_VIEW,
    Permission.MILL_DEVICES_VIEW,
    Permission.OIL_SALES_DEVICES_MANAGE,
    Permission.MILL_DEVICES_MANAGE,
  )
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    this.assertView(user);
    return this.devices.findOne(id);
  }

  @Post(':id/approve')
  @RequireAnyPermissions(Permission.OIL_SALES_DEVICES_MANAGE, Permission.MILL_DEVICES_MANAGE)
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveDeviceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.devices.assertCanManage('any', user.permissions ?? [], user.role);
    return this.devices.approve(id, dto, user.sub);
  }

  @Patch(':id')
  @RequireAnyPermissions(Permission.OIL_SALES_DEVICES_MANAGE, Permission.MILL_DEVICES_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDeviceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.devices.assertCanManage('any', user.permissions ?? [], user.role);
    return this.devices.update(id, dto, user.sub);
  }

  @Post(':id/disable')
  @RequireAnyPermissions(Permission.OIL_SALES_DEVICES_MANAGE, Permission.MILL_DEVICES_MANAGE)
  disable(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    this.devices.assertCanManage('any', user.permissions ?? [], user.role);
    return this.devices.setStatus(id, DeviceStatus.DISABLED, user.sub);
  }

  @Post(':id/enable')
  @RequireAnyPermissions(Permission.OIL_SALES_DEVICES_MANAGE, Permission.MILL_DEVICES_MANAGE)
  enable(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    this.devices.assertCanManage('any', user.permissions ?? [], user.role);
    return this.devices.setStatus(id, DeviceStatus.ACTIVE, user.sub);
  }

  @Delete(':id')
  @RequireAnyPermissions(Permission.OIL_SALES_DEVICES_MANAGE, Permission.MILL_DEVICES_MANAGE)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    this.devices.assertCanManage('any', user.permissions ?? [], user.role);
    return this.devices.remove(id, user.sub);
  }

  private assertView(user: JwtPayload) {
    if (
      !hasPermission(user.permissions, Permission.OIL_SALES_DEVICES_VIEW, user.role) &&
      !hasPermission(user.permissions, Permission.MILL_DEVICES_VIEW, user.role) &&
      !hasPermission(user.permissions, Permission.OIL_SALES_DEVICES_MANAGE, user.role) &&
      !hasPermission(user.permissions, Permission.MILL_DEVICES_MANAGE, user.role)
    ) {
      throw new ForbiddenException();
    }
  }
}
