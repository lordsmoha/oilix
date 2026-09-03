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
import { Permission } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ClientsQueryDto } from './dto/clients-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('الزبائن')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @RequirePermissions(Permission.CLIENTS_READ)
  @ApiOperation({ summary: 'قائمة الزبائن' })
  findAll(@Query() query: ClientsQueryDto) {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(Permission.CLIENTS_READ)
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Post()
  @RequirePermissions(Permission.CLIENTS_WRITE)
  create(@Body() dto: CreateClientDto, @CurrentUser() user: JwtPayload) {
    return this.clientsService.create(dto, user.sub);
  }

  @Patch(':id')
  @RequirePermissions(Permission.CLIENTS_WRITE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.clientsService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @RequirePermissions(Permission.CLIENTS_WRITE)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.clientsService.remove(id, user.sub);
  }
}
