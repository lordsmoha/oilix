import { BadRequestException, Injectable } from '@nestjs/common';
import { OliveType } from '@prisma/client';
import { OLIVE_TYPE_AR } from '../../common/constants/arabic-labels';
import { CLIENT_SOURCES, type ClientSource } from '../../common/constants/client-source';
import { AuditService } from '../audit/audit.service';
import { ClientsService } from '../clients/clients.service';
import { CreateClientDto } from '../clients/dto/create-client.dto';
import { UpdateClientDto } from '../clients/dto/update-client.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { OliveEntriesService } from '../olive-entries/olive-entries.service';
import { SettingsService } from '../settings/settings.service';
import { MobileIntakeDto } from './dto/mobile-intake.dto';

@Injectable()
export class MobileService {
  constructor(
    private clientsService: ClientsService,
    private oliveEntriesService: OliveEntriesService,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
    private settingsService: SettingsService,
  ) {}

  async intake(dto: MobileIntakeDto, userId: string) {
    const seasonId = await this.settingsService.getActiveSeasonId();
    let clientId = dto.clientId;
    let isNewClient = false;

    if (!clientId) {
      if (!dto.firstName?.trim() || !dto.lastName?.trim()) {
        throw new BadRequestException('الاسم واللقب إجباريان لزبون جديد');
      }
      const created = await this.clientsService.create(
        {
          oliveType: dto.oliveType,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          phone: dto.phone?.trim() || undefined,
          notes: dto.notes?.trim() || undefined,
        } satisfies CreateClientDto,
        userId,
        CLIENT_SOURCES.MOBILE,
      );
      clientId = created.id;
      isNewClient = true;
    }

    const entry = await this.oliveEntriesService.create(
      {
        clientId,
        oliveType: dto.oliveType,
        bagCount: dto.bagCount,
        adhlefCount: dto.adhlefCount,
        capacity: dto.capacity,
        weights: [{ bagNumber: 1, weightKg: dto.weightKg, weighRound: 1 }],
        notes: dto.notes,
      },
      userId,
      CLIENT_SOURCES.MOBILE,
    );

    const actorName = await this.auditService.getActorDisplayName(userId);
    const clientName = `${entry.client.firstName} ${entry.client.lastName}`.trim();

    await this.notificationsService.notifyMobileIntake({
      clientName,
      oliveTypeAr: OLIVE_TYPE_AR[dto.oliveType as OliveType],
      oliveType: dto.oliveType,
      weightKg: dto.weightKg,
      actorName,
      actorId: userId,
      seasonId,
      clientId,
      entryId: entry.id,
      isNewClient,
    });

    return {
      client: entry.client,
      entry,
      isNewClient,
    };
  }

  async updateClient(
    id: string,
    dto: UpdateClientDto,
    userId: string,
    source: ClientSource,
  ) {
    const client = await this.clientsService.update(id, dto, userId, source);
    if (source === CLIENT_SOURCES.MOBILE) {
      const actorName = await this.auditService.getActorDisplayName(userId);
      const seasonId = await this.settingsService.getActiveSeasonId();
      await this.notificationsService.notifyMobileClientUpdate({
        clientName: `${client.firstName} ${client.lastName}`.trim(),
        actorName,
        actorId: userId,
        seasonId,
        clientId: client.id,
        summary: 'تحديث المعلومات',
      });
    }
    return client;
  }
}
