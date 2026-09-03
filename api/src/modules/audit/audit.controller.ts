import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditQueryDto } from './dto/audit-query.dto';
import { AuditService } from './audit.service';

@ApiTags('سجل النشاط')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @RequirePermissions(Permission.AUDIT_READ)
  @ApiOperation({ summary: 'سجل النشاط مع تصفية' })
  findAll(@Query() query: AuditQueryDto) {
    return this.auditService.findAll(query);
  }

  @Get('filters')
  @RequirePermissions(Permission.AUDIT_READ)
  @ApiOperation({ summary: 'خيارات التصفية (مستخدمون، إجراءات، موديولات)' })
  filters() {
    return this.auditService.listFilterOptions();
  }
}
