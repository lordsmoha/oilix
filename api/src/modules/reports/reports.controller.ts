import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { OliveType } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { FinancialReportQueryDto } from './dto/financial-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('التقارير')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('financial')
  @RequirePermissions(Permission.FINANCE_READ)
  @ApiOperation({ summary: 'التقرير المالي' })
  financial(@Query() query: FinancialReportQueryDto) {
    return this.reportsService.financialSummary(query);
  }

  @Get('financial-daily')
  @RequirePermissions(Permission.FINANCE_READ)
  @ApiOperation({ summary: 'اليومية المالية' })
  financialDaily(@Query() query: FinancialReportQueryDto) {
    return this.reportsService.financialDaily(query);
  }

  @Get('print/:oliveType')
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({ summary: 'بيانات الطباعة' })
  print(
    @Param('oliveType') oliveType: OliveType,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: 'receipt' | 'cards' | 'phones',
  ) {
    return this.reportsService.printBatch(
      oliveType,
      from ? Number(from) : undefined,
      to ? Number(to) : undefined,
      type ?? 'receipt',
    );
  }

  @Get('receipt/:oliveEntryId')
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({ summary: 'بيانات الإيصال للطباعة' })
  async receipt(@Param('oliveEntryId') oliveEntryId: string) {
    const data = await this.reportsService.receiptData(oliveEntryId);
    if (!data) throw new NotFoundException('العملية غير موجودة');
    return data;
  }

  @Get('client-card/:clientId')
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({ summary: 'بطاقة تعريف — valeurs cumulées par client' })
  async clientCard(
    @Param('clientId') clientId: string,
    @Query('oliveType') oliveType?: OliveType,
  ) {
    const data = await this.reportsService.clientCardData(clientId, oliveType);
    if (!data) throw new NotFoundException('الزبون غير موجود أو لا توجد أوزان');
    return data;
  }

  @Get('client-receipt/:clientId')
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({ summary: 'وصل الزبون — تجميع الوزنات والمبالغ' })
  async clientReceipt(
    @Param('clientId') clientId: string,
    @Query('oliveType') oliveType?: OliveType,
  ) {
    const data = await this.reportsService.clientReceiptData(clientId, oliveType);
    if (!data) throw new NotFoundException('الزبون غير موجود');
    return data;
  }
}
