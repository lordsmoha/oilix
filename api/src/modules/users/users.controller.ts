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
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { SetUserActiveDto } from './dto/set-active.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('المستخدمون')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @RequirePermissions(Permission.USERS_READ)
  @ApiOperation({ summary: 'قائمة المستخدمين' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('roles')
  @RequirePermissions(Permission.USERS_READ)
  @ApiOperation({ summary: 'الأدوار' })
  roles() {
    return this.usersService.listRoles();
  }

  @Get('permission-catalog')
  @RequirePermissions(Permission.USERS_READ)
  @ApiOperation({ summary: 'مصفوفة الصلاحيات' })
  permissionCatalog() {
    return this.usersService.permissionCatalog();
  }

  @Get(':id')
  @RequirePermissions(Permission.USERS_READ)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermissions(Permission.USERS_WRITE)
  create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtPayload) {
    return this.usersService.create(dto, user.sub);
  }

  @Patch(':id')
  @RequirePermissions(Permission.USERS_WRITE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.update(id, dto, user.sub);
  }

  @Patch(':id/active')
  @RequirePermissions(Permission.USERS_WRITE)
  @ApiOperation({ summary: 'تفعيل / تعطيل مستخدم' })
  setActive(
    @Param('id') id: string,
    @Body() dto: SetUserActiveDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.setActive(id, dto.isActive, user.sub);
  }

  @Delete(':id')
  @RequirePermissions(Permission.USERS_WRITE)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.remove(id, user.sub);
  }
}
