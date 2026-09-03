import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OliveType, Permission } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import {
  CreateFiltrationDto,
  FiltrationQueryDto,
  UpdateFiltrationDto,
} from './dto/filtration.dto';
import { FiltrationService } from './filtration.service';

@ApiTags('تصفية الزيت')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('filtration')
export class FiltrationController {
  constructor(private filtrationService: FiltrationService) {}

  @Get('next-reference')
  @RequirePermissions(Permission.FILTRATION_READ)
  @ApiOperation({ summary: 'الرقم التالي لعملية التصفية حسب النوع' })
  nextReference(@Query('oliveType') oliveType?: OliveType) {
    return this.filtrationService.nextReference(oliveType ?? OliveType.GREEN);
  }

  @Get()
  @RequirePermissions(Permission.FILTRATION_READ)
  @ApiOperation({ summary: 'قائمة عمليات التصفية' })
  findAll(@Query() query: FiltrationQueryDto) {
    return this.filtrationService.findAll(query);
  }

  @Get('by-ref/:referenceNumber')
  @RequirePermissions(Permission.FILTRATION_READ)
  @ApiOperation({ summary: 'بحث برقم العملية ونوع الزيتون' })
  findByRef(
    @Param('referenceNumber') referenceNumber: string,
    @Query('oliveType') oliveType: OliveType = OliveType.GREEN,
  ) {
    return this.filtrationService.findByReference(Number(referenceNumber), oliveType);
  }

  @Get(':id')
  @RequirePermissions(Permission.FILTRATION_READ)
  findOne(@Param('id') id: string) {
    return this.filtrationService.findOne(id);
  }

  @Post()
  @RequirePermissions(Permission.FILTRATION_WRITE)
  @ApiOperation({ summary: 'تسجيل عملية تصفية' })
  create(@Body() dto: CreateFiltrationDto, @CurrentUser() user: JwtPayload) {
    return this.filtrationService.create(dto, user.sub);
  }

  @Patch(':id')
  @RequirePermissions(Permission.FILTRATION_WRITE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFiltrationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.filtrationService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @RequirePermissions(Permission.FILTRATION_WRITE)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.filtrationService.remove(id, user.sub);
  }
}
