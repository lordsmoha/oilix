import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import type { ClientSource } from '../../common/constants/client-source';
import { ReqClientSource } from '../../common/decorators/client-source.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UpdateClientDto } from '../clients/dto/update-client.dto';
import { UpdateOliveEntryDto } from '../olive-entries/dto/update-olive-entry.dto';
import { OliveEntriesService } from '../olive-entries/olive-entries.service';
import { MobileIntakeDto } from './dto/mobile-intake.dto';
import { MobileService } from './mobile.service';

@ApiTags('التطبيق المحمول')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('mobile')
export class MobileController {
  constructor(
    private mobileService: MobileService,
    private oliveEntriesService: OliveEntriesService,
  ) {}

  @Post('intake')
  @RequirePermissions(Permission.OLIVE_WRITE, Permission.CLIENTS_WRITE)
  @ApiOperation({ summary: 'إضافة زبون + وزنة (أو وزنة لزبون موجود)' })
  intake(@Body() dto: MobileIntakeDto, @CurrentUser() user: JwtPayload) {
    return this.mobileService.intake(dto, user.sub);
  }

  @Patch('clients/:id')
  @RequirePermissions(Permission.CLIENTS_WRITE)
  @ApiOperation({ summary: 'تعديل زبون من الموبايل' })
  updateClient(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @CurrentUser() user: JwtPayload,
    @ReqClientSource() source: ClientSource,
  ) {
    return this.mobileService.updateClient(id, dto, user.sub, source);
  }

  @Patch('entries/:id')
  @RequirePermissions(Permission.OLIVE_WRITE)
  @ApiOperation({ summary: 'تعديل وزنة من الموبايل' })
  updateEntry(
    @Param('id') id: string,
    @Body() dto: UpdateOliveEntryDto,
    @CurrentUser() user: JwtPayload,
    @ReqClientSource() source: ClientSource,
  ) {
    return this.oliveEntriesService.update(id, dto, user.sub, source);
  }
}
