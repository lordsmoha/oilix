import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ClientsModule } from '../clients/clients.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OliveEntriesModule } from '../olive-entries/olive-entries.module';
import { SettingsModule } from '../settings/settings.module';
import { MobileController } from './mobile.controller';
import { MobileService } from './mobile.service';

@Module({
  imports: [
    ClientsModule,
    OliveEntriesModule,
    NotificationsModule,
    AuditModule,
    SettingsModule,
  ],
  controllers: [MobileController],
  providers: [MobileService],
})
export class MobileModule {}
