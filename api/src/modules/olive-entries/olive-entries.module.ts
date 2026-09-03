import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';
import { ClientsModule } from '../clients/clients.module';
import { OliveEntriesController } from './olive-entries.controller';
import { OliveEntriesService } from './olive-entries.service';

@Module({
  imports: [AuditModule, SettingsModule, ClientsModule, NotificationsModule],
  controllers: [OliveEntriesController],
  providers: [OliveEntriesService],
  exports: [OliveEntriesService],
})
export class OliveEntriesModule {}
