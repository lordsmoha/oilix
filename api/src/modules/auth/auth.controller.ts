import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

@ApiTags('المصادقة')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'تسجيل الدخول' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.ip);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تسجيل الخروج' })
  logout(@CurrentUser() user: JwtPayload, @Req() req: Request) {
    return this.authService.logout(user.sub, user.username, req.ip);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'المستخدم الحالي' })
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.me(user.sub);
  }
}
