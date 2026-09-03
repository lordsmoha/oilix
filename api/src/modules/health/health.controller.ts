import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('الصحة')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'فحص صحة الخدمة' })
  async check() {
    let db = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'error';
    }

    return {
      status: db === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      db,
      version: process.env.npm_package_version ?? '1.0.0',
    };
  }
}
