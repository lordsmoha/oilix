import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('الإشعارات')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @RequirePermissions(Permission.OLIVE_READ)
  @ApiOperation({ summary: 'قائمة الإشعارات' })
  findAll(@Query() query: NotificationQueryDto) {
    return this.notificationsService.findAll(query);
  }

  @Patch('read-all')
  @RequirePermissions(Permission.OLIVE_READ)
  @ApiOperation({ summary: 'تعليم الكل كمقروء' })
  markAllRead() {
    return this.notificationsService.markAllRead();
  }

  @Patch(':id/read')
  @RequirePermissions(Permission.OLIVE_READ)
  @ApiOperation({ summary: 'تعليم إشعار كمقروء' })
  markRead(@Param('id') id: string) {
    return this.notificationsService.markRead(id);
  }
}
