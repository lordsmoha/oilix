import { Global, Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DeviceInterceptor } from './device.interceptor';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

@Global()
@Module({
  imports: [AuditModule],
  controllers: [DevicesController],
  providers: [DevicesService, DeviceInterceptor],
  exports: [DevicesService, DeviceInterceptor],
})
export class DevicesModule {}
